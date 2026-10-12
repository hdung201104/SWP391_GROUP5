import axiosClient from './axiosClient';

export const paymentApi = {
  // Validate promo / voucher code against real database
  validateVoucher: (code, amount) =>
    axiosClient.post('/payment/validate-voucher', { code, amount }),

  // Create payment order (generates VietQR code & creates order in payment_orders table)
  createOrder: (orderData) =>
    axiosClient.post('/payment/checkout', orderData),

  // Check order status by orderCode
  getOrderStatus: (orderCode) =>
    axiosClient.get(`/payment/orders/${orderCode}/status`),

  // Current user's orders history
  getMyOrders: () =>
    axiosClient.get('/payment/my-orders'),

  // Get active subscription plans
  getPlans: (role) =>
    axiosClient.get('/payment/plans', { params: { role } }),

  // Get current active subscription of user
  getMySubscription: () =>
    axiosClient.get('/payment/my-subscription'),

  // Simulate instant payment transfer (test auto-activation without live webhook)
  simulateTransfer: (orderCode) =>
    axiosClient.post(`/payment/simulate-transfer/${orderCode}`),
};

export default paymentApi;
