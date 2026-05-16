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
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { placesAPI } from '../../src/api/places';
import useRideStore from '../../src/store/rideStore';
import useUserStore from '../../src/store/userStore';
import SavedLocationModal from '../../src/components/SavedLocationModal';

export default function SearchLocationScreen() {
  const { pickup, drop, setPickup, setDrop } = useRideStore();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingItemId, setFetchingItemId] = useState(null);
  const [searchType, setSearchType] = useState('drop'); // 'pickup' or 'drop'
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);
  
  const { 
    savedPlaces, searchHistory, fetchSearchHistory, fetchSavedPlaces, 
    addToHistory, addSavedPlace, deleteHistory, deleteSavedPlace 
  } = useUserStore();
  
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchSearchHistory();
    fetchSavedPlaces();
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
    setFetchingItemId(place.place_id);
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

        // Save to history
        addToHistory(location);

        // Navigate to ride-detail only when BOTH are set
        const currentPickup = searchType === 'pickup' ? location : pickup;
        const currentDrop = searchType === 'drop' ? location : drop;
        if (currentPickup?.lat && currentDrop?.lat) {
          router.replace({ pathname: '/(main)/ride-detail' });
        } else if (searchType === 'pickup') {
          setSearchType('drop');
          setQuery('');
        }
      }
    } catch (e) {
      console.error('Place details error:', e);
    }
    setFetchingItemId(null);
  };

  async function handleLikePlace(place) {
    setFetchingItemId(place.place_id);
    try {
      const res = await placesAPI.details(place.place_id);
      if (res.data.success) {
        setPendingSaveData({ 
          address: place.description, 
          lat: res.data.lat, 
          lng: res.data.lng,
          locked: true
        });
        setModalVisible(true);
      }
    } catch (e) {}
    setFetchingItemId(null);
  }

  function handleLikeHistory(item) {
    setPendingSaveData({ 
      address: item.address, 
      lat: item.lat, 
      lng: item.lng,
      locked: true
    });
    setModalVisible(true);
  }

  function handleSelectHistory(item) {
    const location = { address: item.address, lat: parseFloat(item.lat), lng: parseFloat(item.lng) };
    if (searchType === 'pickup') setPickup(location); else setDrop(location);
    
    const currentPickup = searchType === 'pickup' ? location : pickup;
    const currentDrop = searchType === 'drop' ? location : drop;
    if (currentPickup?.lat && currentDrop?.lat) router.replace('/(main)/ride-detail');
    else if (searchType === 'pickup') { setSearchType('drop'); setQuery(''); }
  }

  const confirmDelete = (item, type) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to remove this from your ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => type === 'history' ? deleteHistory(item.id) : deleteSavedPlace(item.id)
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Red Header */}
      <View style={styles.redHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.lekarLogo}>Search Location</Text>
        <View style={{ width: 40 }} />
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
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
          ) : query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={query.length < 2 ? [...savedPlaces, ...searchHistory] : predictions}
        keyExtractor={(item, index) => {
          if (item.place_id) return `prediction-${item.place_id}`;
          if (item.label) return `saved-${item.id}`;
          return `history-${item.id || index}`;
        }}
        renderItem={({ item }) => {
          const isPrediction = !!item.place_id;
          const isSaved = !!item.label;
          const isHistory = !isPrediction && !isSaved;
          const itemId = item.place_id || item.id;
          const isFetching = fetchingItemId === itemId;
          
          return (
            <TouchableOpacity 
              style={[styles.predictionItem, isFetching && styles.predictionItemFetching]} 
              onPress={() => isPrediction ? handleSelectPlace(item) : handleSelectHistory(item)} 
              activeOpacity={0.7}
              disabled={isFetching}
            >
              <View style={[styles.predictionIcon, isSaved && { backgroundColor: COLORS.success + '12' }]}>
                {isFetching ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons 
                    name={isSaved ? (item.label.toLowerCase() === 'home' ? 'home' : item.label.toLowerCase() === 'work' ? 'briefcase' : 'star') : 'location'} 
                    size={18} 
                    color={isSaved ? COLORS.success : COLORS.primary} 
                  />
                )}
              </View>
              <View style={styles.predictionText}>
                <Text style={styles.predictionMain} numberOfLines={1}>{item.main_text || item.label || item.address.split(',')[0]}</Text>
                <Text style={styles.predictionSub} numberOfLines={1}>{item.secondary_text || item.address}</Text>
              </View>
              
              <View style={styles.actionButtons}>
                {(isPrediction || isHistory) && !isFetching && (
                  <TouchableOpacity onPress={() => isPrediction ? handleLikePlace(item) : handleLikeHistory(item)} style={styles.actionBtn}>
                    <Ionicons name="heart-outline" size={22} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
                {(isSaved || isHistory) && !isFetching && (
                  <TouchableOpacity 
                    onPress={() => confirmDelete(item, isSaved ? 'saved places' : 'history')} 
                    style={[styles.actionBtn, { marginLeft: 4 }]}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.predictionsList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={query.length < 2 && (searchHistory.length > 0 || savedPlaces.length > 0) && (
          <Text style={styles.sectionTitle}>{savedPlaces.length > 0 ? 'Saved & Recent' : 'Recent Searches'}</Text>
        )}
      />

      <SavedLocationModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          try {
            await addSavedPlace(data);
            setModalVisible(false);
            fetchSavedPlaces();
          } catch (e) { alert('Already exists or error'); }
        }}
        initialData={pendingSaveData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  
  // Red Header
  redHeader: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 16,
  },
  headerBackBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  lekarLogo: {
    fontSize: 20, fontWeight: '800', color: COLORS.white,
  },

  // Inputs
  inputsCard: {
    marginHorizontal: 16, marginTop: -12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
    ...SHADOWS.medium,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  inputRowActive: { backgroundColor: COLORS.inputBg, borderRadius: 16 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 44, marginRight: 16 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  inputLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, padding: 0, fontWeight: '500' },

  predictionsList: { paddingTop: 16, paddingBottom: 40 },
  predictionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border + '30',
  },
  predictionItemFetching: { backgroundColor: '#F8F9FA' },
  predictionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  predictionText: { flex: 1 },
  predictionMain: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },
  predictionSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F8F9FA' },
  
  sectionTitle: { 
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, 
    fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, 
    textTransform: 'uppercase', letterSpacing: 1.2 
  },
});
