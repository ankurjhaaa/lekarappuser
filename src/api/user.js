import client from './client';

export const userAPI = {
  getProfile: () => client.get('/user/profile'),
  updateProfile: (data) => client.put('/user/profile', data),
  
  getSavedPlaces: () => client.get('/user/saved-places'),
  addSavedPlace: (data) => client.post('/user/saved-places', data),
  deleteSavedPlace: (id) => client.delete(`/user/saved-places/${id}`),
  
  getSearchHistory: () => client.get('/user/search-history'),
  addSearchHistory: (data) => client.post('/user/search-history', data),
  deleteSearchHistory: (id) => client.delete(`/user/search-history/${id}`),
  
  getNotifications: () => client.get('/user/notifications'),
  markNotificationsRead: (ids) => client.post('/user/notifications/read', { ids }),
  
  triggerSos: (data) => client.post('/user/sos', data),
};
