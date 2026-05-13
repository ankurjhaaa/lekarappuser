import api from './client';

export const placesAPI = {
  autocomplete: (input, lat, lng) => api.get('/places/autocomplete', { params: { input, lat, lng } }),
  details: (place_id) => api.get('/places/details', { params: { place_id } }),
  directions: (origin_lat, origin_lng, destination_lat, destination_lng) =>
    api.get('/places/directions', { params: { origin_lat, origin_lng, destination_lat, destination_lng } }),
  reverseGeocode: (lat, lng) => api.get('/places/reverse-geocode', { params: { lat, lng } }),
};
