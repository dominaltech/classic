// Vercel Serverless Function to Send Encrypted Web Push Notifications to Admin PWA (with strict deduplication)
const webpush = require('web-push');

const recentPushes = global.__recentPushes || (global.__recentPushes = new Map());

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:classicbydominal@gmail.com";
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFPUamUZsFMswRhmwXNa1lCFPcCLCaBLVN7R4Kuae6ZoVMoFsxNZePyhkTBvTDqp-PqlknIKn6H-NrZthA5JiU8";
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "KIV1Nl5eluwxYNTWc_CUTSAzls_BV4G9Dc3_iUmGKSQ";

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  try {
    const { title, message, order_id, amount, event_type } = req.body || {};
    const notifKey = `${order_id || 'general'}_${event_type || title || 'order'}`;
    const now = Date.now();

    // STRICT DEDUPLICATION: Prevent duplicate pushes for the same order event within 5 minutes
    if (order_id && recentPushes.has(notifKey)) {
      const lastSent = recentPushes.get(notifKey);
      if (now - lastSent < 300000) {
        console.log(`[Push Deduplicated] Push for ${notifKey} was already dispatched ${Math.round((now - lastSent)/1000)}s ago.`);
        return res.status(200).json({ success: true, count: 0, deduplicated: true, message: 'Notification already dispatched recently.' });
      }
    }
    recentPushes.set(notifKey, now);

    const payload = JSON.stringify({
      title: title || 'NEW CLASSIC COLLECTION ORDER!',
      body: message || `Order ${order_id || ''} for ₹${amount || '0'}`,
      order_id: order_id || '',
      icon: '/images/logo.png'
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mizbiarhnxzrpfuodqnj.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemJpYXJobnh6cnBmdW9kcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTg3NTYsImV4cCI6MjEwNDA3NDc1Nn0.plMkDTZJ7wy2D6yLWtRmJU_gvJ9z-zZYXumbOlWHCrU";

    const fetchRes = await fetch(`${supabaseUrl}/rest/v1/admin_push_subscriptions?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const subscriptions = await fetchRes.json();

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No active admin push subscriptions registered.' });
    }

    const pushPromises = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      return webpush.sendNotification(pushConfig, payload).catch(err => {
        console.error('Failed push dispatch to endpoint:', sub.endpoint, err);
      });
    });

    await Promise.all(pushPromises);
    return res.status(200).json({ success: true, count: subscriptions.length });
  } catch (error) {
    console.error('Send push serverless error:', error);
    return res.status(500).json({ error: error.message });
  }
};
