import React from 'react';
import { View, Text } from 'react-native';

/**
 * Web version of MapViewSafe.
 * Provides stubs to prevent bundling react-native-maps on web.
 */

const MapView = (props) => (
  <View style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, props.style]}>
    <Text style={{ color: '#888' }}>Map not available on web</Text>
    {props.children}
  </View>
);

const Marker = () => null;
const Polyline = () => null;
const PROVIDER_GOOGLE = 'google';

export { MapView as default, Marker, Polyline, PROVIDER_GOOGLE };
