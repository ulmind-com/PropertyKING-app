import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image as RNImage, Dimensions,
  StatusBar, Platform, TextInput, ActivityIndicator, Animated, Keyboard, Vibration, FlatList, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Image } from 'expo-image';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI } from '../../api';
import { MapView, Marker } from '../../components/Map/MapViewComponent';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 160;
const INITIAL_DELTA = { latitudeDelta: 0.12, longitudeDelta: 0.12 };

// Safely extract lat/lng from GeoPoint {type, coordinates: [lng, lat]} or raw array
const getCoords = (location) => {
  const c = location?.coordinates;
  if (!c) return null;
  // GeoPoint object: { type: "Point", coordinates: [lng, lat] }
  if (c.coordinates && Array.isArray(c.coordinates)) {
    return { lat: c.coordinates[1], lng: c.coordinates[0] };
  }
  // Raw array: [lng, lat]
  if (Array.isArray(c)) {
    return { lat: c[1], lng: c[0] };
  }
  return null;
};

// Premium dark map style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a5a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#262626' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6a6a6a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#222222' }] },
];

// ──────────────────────────────────────────────────────────────
// Ultimate Stable Android Map Marker
// Removing ALL elevation and shadows! Android Map's snapshot
// engine severely crops markers if they have elevation or shadows.
// A simple strict-sized view guarantees it will not be cropped.
// ──────────────────────────────────────────────────────────────
const PropertyMarker = React.memo(({ prop, coords, onPress, getImage }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Marker
      coordinate={{ latitude: coords.lat, longitude: coords.lng }}
      onPress={onPress}
      tracksViewChanges={!loaded}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ 
        width: 44, 
        height: 44, 
        borderRadius: 22,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <RNImage
          source={{ uri: getImage }}
          style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          onLoad={() => {
            if (!loaded) setLoaded(true);
          }}
        />
      </View>
    </Marker>
  );
});

export default function MapExploreScreen({ navigation }) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Card slide animation
  const cardAnim = useRef(new Animated.Value(CARD_HEIGHT + 100)).current;

  // ─── LOCATION & INITIAL LOAD ───
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const fallback = { lat: 40.7128, lng: -74.006 };
          setUserCoords(fallback);
          setRegion({ latitude: fallback.lat, longitude: fallback.lng, ...INITIAL_DELTA });
          loadProperties(fallback);
          return;
        }
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserCoords(coords);
        setRegion({ latitude: coords.lat, longitude: coords.lng, ...INITIAL_DELTA });
        loadProperties(coords);
      } catch (e) {
        const fallback = { lat: 40.7128, lng: -74.006 };
        setUserCoords(fallback);
        setRegion({ latitude: fallback.lat, longitude: fallback.lng, ...INITIAL_DELTA });
        loadProperties(fallback);
      }
    })();
  }, []);

  // ─── LOAD PROPERTIES ───
  const loadProperties = async (coords, radiusMiles = 50) => {
    setLoading(true);
    try {
      const res = await propertyAPI.nearby({
        lat: coords.lat, lng: coords.lng,
        radius_miles: radiusMiles, limit: 50,
      });
      setProperties(res.data?.properties || []);
    } catch (e) {
      console.log('[MapExplore] load error:', e);
    }
    setLoading(false);
  };

  // ─── RE-CENTER MAP ───
  const reCenter = useCallback(() => {
    if (!userCoords || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: userCoords.lat,
      longitude: userCoords.lng,
      ...INITIAL_DELTA,
    }, 600);
  }, [userCoords]);

  // ─── MARKER TAP → show bottom card ───
  const onMarkerPress = useCallback((property) => {
    // Isolated premium haptic pop
    Vibration.vibrate(50);
    
    setSelectedProperty(property);
    Animated.spring(cardAnim, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();

    // Center map on this marker
    const coords = getCoords(property.location);
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 400);
    }
  }, []);

  // ─── DISMISS CARD ───
  const dismissCard = useCallback(() => {
    Animated.timing(cardAnim, {
      toValue: CARD_HEIGHT + 100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSelectedProperty(null));
  }, []);

  // ─── MAP TAP (dismiss card) ───
  const onMapPress = useCallback(() => {
    if (selectedProperty) dismissCard();
    Keyboard.dismiss();
  }, [selectedProperty]);

  // ─── AUTOCOMPLETE SUGGESTIONS ───
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const fetchSuggestions = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&countrycodes=us`);
        const data = await resp.json();
        setSuggestions(data.map(d => ({
          display: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          short: [d.address?.city || d.address?.town || d.address?.village || d.address?.county, d.address?.state].filter(Boolean).join(', ') || d.display_name.split(',').slice(0, 2).join(','),
        })));
        setShowSuggestions(true);
      } catch(e) { setSuggestions([]); }
    }, 350);
  };

  const handleSearchInput = (val) => {
    setSearchText(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = async (sug) => {
    setSearchText(sug.short);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setSearching(true);
    const c = { lat: sug.lat, lng: sug.lng };
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: c.lat, longitude: c.lng,
        latitudeDelta: 0.08, longitudeDelta: 0.08,
      }, 800);
    }
    await loadProperties(c, 50);
    setSearching(false);
  };

  // ─── SEARCH (geocode → pan map → load properties) ───
  const [searching, setSearching] = useState(false);
  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) return;
    Keyboard.dismiss();
    setShowSuggestions(false);
    setSuggestions([]);
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const newCoords = { lat: latitude, lng: longitude };
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude, longitude,
            latitudeDelta: 0.08, longitudeDelta: 0.08,
          }, 800);
        }
        await loadProperties(newCoords, 50);
      }
    } catch (e) {
      console.log('[MapExplore] geocode error:', e);
    }
    setSearching(false);
  };

  // ─── REGION CHANGE ───
  const onRegionChangeComplete = useCallback((newRegion) => {
    if (!userCoords) return;
    const newCenter = { lat: newRegion.latitude, lng: newRegion.longitude };
    const dLat = Math.abs(newCenter.lat - (userCoords?.lat || 0));
    const dLng = Math.abs(newCenter.lng - (userCoords?.lng || 0));
    if (dLat > 0.05 || dLng > 0.05) {
      loadProperties(newCenter, 50);
    }
  }, [userCoords]);

  // ─── HELPERS ───
  const formatPrice = (price, unit) => {
    if (!price) return '$0';
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
    if (unit === 'per_month') return `${f}/mo`;
    return f;
  };

  const getMarkerImage = (property) => {
    return property?.images?.find(i => i.is_primary)?.url
      || property?.images?.[0]?.url
      || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100';
  };

  if (!region) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[FONTS.caption, { marginTop: 12 }]}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ═══════════ MAP ═══════════ */}
      <MapView
        ref={mapRef}
        style={st.map}
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={onMapPress}
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={onRegionChangeComplete}
        mapPadding={{ top: 100, right: 0, bottom: 0, left: 0 }}
      >
        {mapReady && (() => {
          // Spread overlapping markers that share the same coordinates
          const coordMap = {};
          const jitteredProps = properties.map((prop) => {
            const coords = getCoords(prop.location);
            if (!coords) return null;
            const key = `${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
            if (!coordMap[key]) coordMap[key] = 0;
            const index = coordMap[key]++;
            return { prop, coords, index, key };
          }).filter(Boolean);

          // Apply jitter to duplicates
          const countMap = {};
          jitteredProps.forEach(item => {
            countMap[item.key] = (countMap[item.key] || 0) + 1;
          });

          return jitteredProps.map((item) => {
            let { coords } = item;
            const total = countMap[item.key];
            if (total > 1) {
              // Spread in a circle: ~0.0008 degrees ≈ ~80m offset
              const angle = (2 * Math.PI * item.index) / total;
              const offset = 0.0008;
              coords = {
                lat: coords.lat + offset * Math.cos(angle),
                lng: coords.lng + offset * Math.sin(angle),
              };
            }
            return (
              <PropertyMarker
                key={item.prop.id}
                prop={item.prop}
                coords={coords}
                getImage={getMarkerImage(item.prop)}
                onPress={() => onMarkerPress(item.prop)}
              />
            );
          });
        })()}
      </MapView>

      {/* ═══════════ SEARCH BAR OVERLAY ═══════════ */}
      <View style={st.searchOverlay}>
        <View style={[st.searchBar, showSuggestions && suggestions.length > 0 && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
          {searching ? (
            <ActivityIndicator size={18} color={COLORS.primary} />
          ) : (
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
          )}
          <TextInput
            style={st.searchInput}
            placeholder="Search city, address, zip code..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={handleSearchInput}
            onSubmitEditing={handleSearch}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            returnKeyType="search"
            editable={!searching}
          />
          {searchText.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); setShowSuggestions(false); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={st.suggestionsContainer}>
            {suggestions.map((sug, i) => (
              <TouchableOpacity
                key={i}
                style={[st.suggestionItem, i < suggestions.length - 1 && st.suggestionBorder]}
                onPress={() => handleSelectSuggestion(sug)}
                activeOpacity={0.7}
              >
                <View style={st.suggestionIcon}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.suggestionShort} numberOfLines={1}>{sug.short}</Text>
                  <Text style={st.suggestionFull} numberOfLines={1}>{sug.display}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ═══════════ PROPERTY COUNT PILL ═══════════ */}
      <View style={st.countPill}>
        <Ionicons name="home" size={14} color="#FFF" />
        <Text style={st.countText}>
          {loading ? '...' : `${properties.length} properties`}
        </Text>
      </View>

      {/* ═══════════ RE-CENTER FAB ═══════════ */}
      <TouchableOpacity style={st.recenterBtn} onPress={reCenter} activeOpacity={0.8}>
        <Ionicons name="locate" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* ═══════════ SELECTED PROPERTY BOTTOM CARD ═══════════ */}
      {selectedProperty && (
        <Animated.View style={[st.cardContainer, { transform: [{ translateY: cardAnim }] }]}>
          <TouchableOpacity
            style={st.card}
            activeOpacity={0.95}
            onPress={() => {
              navigation.navigate('PropertyDetails', {
                slug: selectedProperty.slug || selectedProperty.id,
                property: selectedProperty,
                userCoords,
              });
            }}
          >
            {/* Card Image */}
            <Image
              source={{ uri: getMarkerImage(selectedProperty) }}
              style={st.cardImage}
              contentFit="cover"
            />

            {/* Card Info */}
            <View style={st.cardInfo}>
              {/* Listing Badge */}
              <View style={[st.cardBadge,
                selectedProperty.listing_type === 'rent' ? st.cardBadgeRent : st.cardBadgeSale
              ]}>
                <Text style={st.cardBadgeText}>
                  {selectedProperty.listing_type === 'sale' ? 'SALE' : 'RENT'}
                </Text>
              </View>

              <Text style={st.cardTitle} numberOfLines={2}>
                {selectedProperty.title}
              </Text>

              <View style={st.cardLocRow}>
                <Ionicons name="location" size={12} color={COLORS.textMuted} />
                <Text style={st.cardLocText} numberOfLines={1}>
                  {selectedProperty.location?.city}
                  {selectedProperty.location?.state ? `, ${selectedProperty.location.state}` : ''}
                </Text>
              </View>

              {/* Stats */}
              <View style={st.cardStats}>
                {selectedProperty.details?.bedrooms > 0 && (
                  <View style={st.cardStatItem}>
                    <Ionicons name="bed-outline" size={12} color={COLORS.textMuted} />
                    <Text style={st.cardStatText}>{selectedProperty.details.bedrooms}</Text>
                  </View>
                )}
                {selectedProperty.details?.bathrooms > 0 && (
                  <View style={st.cardStatItem}>
                    <Ionicons name="water-outline" size={12} color={COLORS.textMuted} />
                    <Text style={st.cardStatText}>{selectedProperty.details.bathrooms}</Text>
                  </View>
                )}
                {selectedProperty.details?.total_sqft > 0 && (
                  <View style={st.cardStatItem}>
                    <Ionicons name="resize-outline" size={12} color={COLORS.textMuted} />
                    <Text style={st.cardStatText}>{selectedProperty.details.total_sqft.toLocaleString()} sqft</Text>
                  </View>
                )}
              </View>

              {/* Price */}
              <Text style={st.cardPrice}>
                {formatPrice(selectedProperty.price, selectedProperty.price_unit)}
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={st.cardClose}
              onPress={(e) => {
                e.stopPropagation?.();
                dismissCard();
              }}
            >
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  map: { ...StyleSheet.absoluteFillObject },

  // ─── SEARCH ───
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    gap: 10,
    ...SHADOWS.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Raleway_500Medium',
  },

  // ─── SUGGESTIONS ───
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...SHADOWS.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionShort: {
    fontSize: 13,
    fontFamily: 'Raleway_600SemiBold',
    color: COLORS.text,
  },
  suggestionFull: {
    fontSize: 11,
    fontFamily: 'Raleway_400Regular',
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ─── COUNT PILL ───
  countPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 104,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 10,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Raleway_600SemiBold',
  },

  // ─── RE-CENTER ───
  recenterBtn: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
    zIndex: 10,
  },

  // ─── BOTTOM PROPERTY CARD ───
  cardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  cardImage: {
    width: 130,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.bgDark || '#222',
  },
  cardInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  cardBadgeSale: { backgroundColor: COLORS.primary },
  cardBadgeRent: { backgroundColor: '#8B5CF6' },
  cardBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Raleway_800ExtraBold',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Raleway_700Bold',
    color: COLORS.text,
    lineHeight: 19,
  },
  cardLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardLocText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'Raleway_500Medium',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardStatText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'Raleway_600SemiBold',
  },
  cardPrice: {
    fontSize: 18,
    fontFamily: 'Raleway_800ExtraBold',
    color: COLORS.primary,
    marginTop: 4,
  },
  cardClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
