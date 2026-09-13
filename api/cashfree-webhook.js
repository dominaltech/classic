// Cashfree Webhook Handler (with strict deduplication and schema constraint safety)
const webpush = require('web-push');

const recentPushes = global.__recentPushes || (global.__recentPushes = new Map());

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Cashfree Webhook Payload Received:', JSON.stringify(payload));

    const orderData = payload.data ? payload.data.order : null;
    const paymentData = payload.data ? payload.data.payment : null;

    if (orderData && orderData.order_id) {
      const orderId = orderData.order_id;
      const amount = orderData.order_amount || (paymentData ? paymentData.payment_amount : 0);
      const isSuccess = payload.type === 'PAYMENT_SUCCESS_WEBHOOK' || (paymentData && paymentData.payment_status === 'SUCCESS');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mizbiarhnxzrpfuodqnj.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemJpYXJobnh6cnBmdW9kcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTg3NTYsImV4cCI6MjEwNDA3NDc1Nn0.plMkDTZJ7wy2D6yLWtRmJU_gvJ9z-zZYXumbOlWHCrU";

      // 1. Check current order status in DB to prevent redundant duplicate push
      let currentOrder = null;
      try {
        const fetchDb = await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${orderId}&select=*`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const rows = await fetchDb.json();
        if (rows && rows.length > 0) currentOrder = rows[0];
      } catch (e) {}

      const customerName = currentOrder?.customer_name || 'Customer';
      const customerPhone = currentOrder?.customer_phone || '';

      const vapidSubject = process.env.VAPID_SUBJECT || "mailto:classicbydominal@gmail.com";
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFPUamUZsFMswRhmwXNa1lCFPcCLCaBLVN7R4Kuae6ZoVMoFsxNZePyhkTBvTDqp-PqlknIKn6H-NrZthA5JiU8";
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "KIV1Nl5eluwxYNTWc_CUTSAzls_BV4G9Dc3_iUmGKSQ";
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

      if (isSuccess) {
        // 2. Update Supabase order status to PAID / PLACED (matches DB CHECK constraint)
        await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${orderId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            payment_status: 'PAID',
            order_status: 'PLACED',
            updated_at: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook order update error:', err));

        // 3. Dispatch Push Notification only if not already notified
        const pushKey = `${orderId}_PAYMENT_SUCCESS`;
        const now = Date.now();
        const alreadyNotified = (currentOrder && currentOrder.payment_status === 'PAID') || (recentPushes.has(pushKey) && (now - recentPushes.get(pushKey) < 300000));

        if (!alreadyNotified) {
          recentPushes.set(pushKey, now);
          try {
            const pushPayload = JSON.stringify({
              title: 'PAYMENT SUCCESSFUL - NEW ORDER!',
              body: `Order #${orderId} payment verified for ₹${amount} (Cashfree Paid)`,
              order_id: orderId,
              icon: '/images/logo.png'
            });

            const fetchRes = await fetch(`${supabaseUrl}/rest/v1/admin_push_subscriptions?select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            const subscriptions = await fetchRes.json();

            if (subscriptions && Array.isArray(subscriptions)) {
              await Promise.all(subscriptions.map(sub => {
                return webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, pushPayload).catch(() => {});
              }));
            }
          } catch(pushErr) {
            console.error('Webhook push dispatch error:', pushErr);
          }
        }
      } else if (payload.type === 'PAYMENT_FAILED_WEBHOOK' || payload.type === 'PAYMENT_USER_DROPPED_WEBHOOK' || (paymentData && (paymentData.payment_status === 'FAILED' || paymentData.payment_status === 'USER_DROPPED'))) {
        // Update to FAILED / CANCELLED
        await fetch(`${supabaseUrl}/rest/v1/orders?order_number=eq.${orderId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            payment_status: 'FAILED',
            order_status: 'CANCELLED',
            updated_at: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook failed order update error:', err));

        const pushKey = `${orderId}_PAYMENT_CANCELLED`;
        const now = Date.now();
        const alreadyNotified = (currentOrder && currentOrder.order_status === 'CANCELLED') || (recentPushes.has(pushKey) && (now - recentPushes.get(pushKey) < 300000));

        if (!alreadyNotified) {
          recentPushes.set(pushKey, now);
          try {
            const pushPayload = JSON.stringify({
              title: 'PAYMENT CANCELLED / NOT DONE',
              body: `Order #${orderId} (₹${amount}) attempt by ${customerName} (${customerPhone}) was cancelled / unpaid.`,
              order_id: orderId,
              icon: '/images/logo.png'
            });

            const fetchRes = await fetch(`${supabaseUrl}/rest/v1/admin_push_subscriptions?select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            const subscriptions = await fetchRes.json();

            if (subscriptions && Array.isArray(subscriptions)) {
              await Promise.all(subscriptions.map(sub => {
                return webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, pushPayload).catch(() => {});
              }));
            }
          } catch(pushErr) {
            console.error('Webhook cancel push error:', pushErr);
          }
        }
      }
    }

    return res.status(200).json({ status: 'OK', received: true });
  } catch (error) {
    console.error('Cashfree webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};
