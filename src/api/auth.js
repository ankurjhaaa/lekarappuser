import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (phone) => api.post('/auth/login', { phone }),
  loginEmail: (email) => api.post('/auth/login-email', { email }),
  loginPassword: (data) => api.post('/auth/login-password', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateFcmToken: (fcm_token, device_type) => api.post('/auth/fcm-token', { fcm_token, device_type }),
};
