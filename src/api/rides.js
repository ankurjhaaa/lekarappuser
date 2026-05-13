import api from './client';

export const ridesAPI = {
  getVehicles: () => api.get('/vehicles'),
  estimate: (data) => api.post('/rides/estimate', data),
  nearbyDrivers: (lat, lng) => api.get('/rides/nearby-drivers', { params: { lat, lng } }),
  book: (data) => api.post('/rides/book', data),
  getActive: () => api.get('/rides/active'),
  getStatus: (id) => api.get(`/rides/${id}/status`),
  trackDriver: (id) => api.get(`/rides/${id}/track`),
  cancel: (id, reason) => api.post(`/rides/${id}/cancel`, { cancel_reason: reason }),
  review: (id, rating, comment) => api.post(`/rides/${id}/review`, { rating, comment }),
  history: (page = 1) => api.get('/rides/history', { params: { page } }),
  // SOS
  triggerSos: (data) => api.post('/user/sos', data),
  // Coupons
  getCoupons: () => api.get('/user/coupons'),
  applyCoupon: (code, fare) => api.post('/user/coupons/apply', { code, fare }),
};
