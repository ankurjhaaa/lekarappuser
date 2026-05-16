import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  DeviceEventEmitter,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { placesAPI } from '../../src/api/places';
import useRideStore from '../../src/store/rideStore';

export default function SearchLocationScreen() {
  const { pickup, drop, setPickup, setDrop } = useRideStore();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('drop'); // 'pickup' or 'drop'
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setPredictions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await placesAPI.autocomplete(
          query,
          pickup?.lat || null,
          pickup?.lng || null
        );
        if (res.data.success) setPredictions(res.data.predictions || []);
      } catch (e) { /* silent */ }
      setLoading(false);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelectPlace = async (place) => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await placesAPI.details(place.place_id);
      if (res.data.success) {
        const location = {
          address: place.description,
          lat: res.data.lat,
          lng: res.data.lng,
        };

        if (searchType === 'pickup') {
          setPickup(location);
        } else {
          setDrop(location);
        }

        if (params?.mode === 'change_dest') {
          DeviceEventEmitter.emit('change_destination_selected', place);
          router.back();
          return;
        }

        // Navigate to ride-detail only when BOTH are set
        const currentPickup = searchType === 'pickup' ? location : pickup;
        const currentDrop = searchType === 'drop' ? location : drop;
        if (currentPickup?.lat && currentDrop?.lat) {
          router.replace({ pathname: '/(main)/ride-detail' });
        } else if (searchType === 'pickup') {
          // Auto switch to drop search after setting pickup
          setSearchType('drop');
          setQuery('');
          setSuggestions([]);
        }
      }
    } catch (e) {
      console.error('Place details error:', e);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set destination</Text>
      </View>

      {/* Location Inputs */}
      <View style={styles.inputsCard}>
        {/* Pickup */}
        <TouchableOpacity
          style={[styles.inputRow, searchType === 'pickup' && styles.inputRowActive]}
          onPress={() => { setSearchType('pickup'); setQuery(''); inputRef.current?.focus(); }}
        >
          <View style={styles.dotGreen} />
          <Text style={styles.inputLabel} numberOfLines={1}>
            {pickup?.address || 'Current Location'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Drop */}
        <View style={[styles.inputRow, searchType === 'drop' && styles.inputRowActive]}>
          <View style={styles.dotRed} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Where to?"
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchType('drop')}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      {/* Predictions */}
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.predictionItem} onPress={() => handleSelectPlace(item)} activeOpacity={0.7}>
            <View style={styles.predictionIcon}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.predictionText}>
              <Text style={styles.predictionMain} numberOfLines={1}>{item.main_text}</Text>
              <Text style={styles.predictionSub} numberOfLines={1}>{item.secondary_text}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.predictionsList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding,
    paddingTop: 12, paddingBottom: 12, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },

  inputsCard: {
    marginHorizontal: SIZES.padding, backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  inputRowActive: { backgroundColor: COLORS.white },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 40 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  inputLabel: { flex: 1, fontSize: SIZES.md, color: COLORS.text },
  searchInput: { flex: 1, fontSize: SIZES.md, color: COLORS.text, padding: 0 },

  loadingRow: { paddingVertical: 12, alignItems: 'center' },

  predictionsList: { paddingTop: 8 },
  predictionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding,
    paddingVertical: 14, gap: 14,
  },
  predictionIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  predictionText: { flex: 1 },
  predictionMain: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  predictionSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
});
