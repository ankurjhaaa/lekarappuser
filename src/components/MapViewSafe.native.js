import { Platform } from 'react-native';

/**
 * Web-safe wrapper for react-native-maps.
 * react-native-maps is native-only; on web we export stubs.
 */

let MapView, Marker, Polyline, PROVIDER_GOOGLE;

if (Platform.OS === 'web') {
  // Stub components for web
  const { View } = require('react-native');
  MapView = (props) => View(props);
  MapView.displayName = 'MapViewStub';
  Marker = (props) => null;
  Polyline = (props) => null;
  PROVIDER_GOOGLE = null;
} else {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export { MapView as default, Marker, Polyline, PROVIDER_GOOGLE };
