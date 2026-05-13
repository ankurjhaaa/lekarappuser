import { create } from 'zustand';

/**
 * Ride store — manages active ride state.
 * Updated by WebSocket events and API polling.
 */
const useRideStore = create((set) => ({
  // Current ride
  activeBooking: null,
  rideStatus: null,       // searching_driver, driver_assigned, etc.
  
  // Ride details
  pickup: null,           // { address, lat, lng }
  drop: null,             // { address, lat, lng }
  distance: 0,
  duration: 0,
  fare: 0,
  vehicleType: 'bike',
  routeGeometry: null,    // encoded polyline string
  
  // Driver info (when assigned)
  driver: null,
  driverLocation: null,   // { lat, lng }
  driverProfile: null,
  otpCode: null,
  
  // Nearby drivers for map
  nearbyDrivers: [],
  
  // Vehicle options
  vehicles: [],
  estimates: [],
  
  // Actions
  setPickup: (pickup) => set({ pickup }),
  setDrop: (drop) => set({ drop }),
  setRoute: (distance, duration, routeGeometry) => set({ distance, duration, routeGeometry }),
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setVehicles: (vehicles) => set({ vehicles }),
  setEstimates: (estimates) => set({ estimates }),
  setNearbyDrivers: (nearbyDrivers) => set({ nearbyDrivers }),
  
  setActiveBooking: (booking) => set({
    activeBooking: booking,
    rideStatus: booking?.status || null,
    otpCode: booking?.otp_code || null,
  }),
  
  setDriver: (driver) => set({ driver }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setDriverProfile: (profile) => set({ driverProfile: profile }),
  
  // Update from WebSocket event
  updateFromEvent: (data) => set((state) => ({
    rideStatus: data.status || state.rideStatus,
    otpCode: data.otp_code || state.otpCode,
    fare: data.fare_total || data.total_amount || state.fare,
    driver: data.driver_name ? {
      ...state.driver,
      name: data.driver_name,
      phone: data.driver_phone,
      id: data.driver_id,
    } : state.driver,
    activeBooking: { ...state.activeBooking, ...data },
  })),
  
  // Clear ride state
  clearRide: () => set({
    activeBooking: null, rideStatus: null, pickup: null, drop: null,
    distance: 0, duration: 0, fare: 0, vehicleType: 'bike',
    routeGeometry: null, driver: null, driverLocation: null,
    driverProfile: null, otpCode: null, estimates: [],
  }),
}));

export default useRideStore;
