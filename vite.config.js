import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'pages/login.html',
        signup: 'pages/signup.html',
        profile: 'pages/profile.html',
        listing: 'pages/listing.html',
        product: 'pages/product.html',
        cart: 'pages/cart.html',
        checkout: 'pages/checkout.html',
        orders: 'pages/orders.html',
        orderDetail: 'pages/order-detail.html',
        orderConfirmation: 'pages/order-confirmation.html',
        notFound: 'pages/404.html',
      },
    },
  },
});
