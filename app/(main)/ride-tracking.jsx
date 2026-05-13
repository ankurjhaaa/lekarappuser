import { View, Text, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

// Ride tracking is handled by ride-detail screen itself
export default function RideTrackingScreen() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: '/(main)/ride-detail', params }} />;
}
