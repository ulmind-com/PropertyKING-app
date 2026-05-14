import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions,
  StatusBar, Platform, TextInput, ActivityIndicator, Animated, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI } from '../../api';
import { MapView, Marker, Callout } from '../../components/Map/MapViewComponent.native';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 160;
const INITIAL_DELTA = { latitudeDelta: 0.12, longitudeDelta: 0.12 };

// Safely extract [lat, lng] from GeoPoint {type, coordinates: [lng, lat]} or raw array
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

export default function MapExploreScreen({ navigation }) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // ─── LOCATION & INITIAL LOAD ───
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Fallback to a default location
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

  // ─── MARKER TAP ───
  const onMarkerPress = useCallback((property) => {
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

  // ─── MAP TAP ───
  const onMapPress = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // ─── SEARCH ───
  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('PropertyListing', { search: searchText });
    }
  };

  // ─── REGION CHANGE ───
  const onRegionChangeComplete = useCallback((newRegion) => {
    // Reload properties when user pans the map significantly
    if (!userCoords) return;
    const newCenter = { lat: newRegion.latitude, lng: newRegion.longitude };
    // Calculate rough distance moved
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
        {mapReady && properties.map((prop) => {
          const coords = getCoords(prop.location);
          if (!coords) return null;

          return (
            <Marker
              key={prop.id}
              coordinate={{ latitude: coords.lat, longitude: coords.lng }}
              onPress={() => onMarkerPress(prop)}
            >
              <View style={st.markerWrap}>
                <Image
                  source={{ uri: getMarkerImage(prop) }}
                  style={st.markerImg}
                />
              </View>

              <Callout tooltip onPress={() => navigation.navigate('PropertyDetails', { slug: prop.slug || prop.id, property: prop, userCoords })}>
                <View style={st.calloutContainer}>
                  {/* Top Box: Bedrooms */}
                  <View style={st.calloutBox}>
                    <Text style={st.calloutValue}>{prop.details?.bedrooms || 0}</Text>
                    <Text style={st.calloutLabel}>Bedrooms</Text>
                  </View>
                  
                  {/* Middle Box: Price */}
                  <View style={st.calloutBox}>
                    <Text style={st.calloutValue}>{formatPrice(prop.price, prop.price_unit)}</Text>
                    <Text style={st.calloutLabel}>Estimate House Price</Text>
                  </View>
                  
                  {/* Bottom Box: Year Built */}
                  <View style={st.calloutBox}>
                    <Text style={st.calloutValue}>{prop.details?.year_built || 'N/A'}</Text>
                    <Text style={st.calloutLabel}>Year Built</Text>
                  </View>
                  
                  {/* Arrow Pointing to Marker */}
                  <View style={st.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* ═══════════ SEARCH BAR OVERLAY ═══════════ */}
      <View style={st.searchOverlay}>
        <View style={st.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={st.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══════════ PROPERTY COUNT PILL ═══════════ */}
      <View style={st.countPill}>
        <Ionicons name="home" size={14} color="#FFF" />
        <Text style={st.countText}>
          {loading ? '...' : `${properties.length} properties`}
        </Text>
      </View>

      {/* Re-center button placed at bottom corner */}
      <TouchableOpacity style={st.recenterBtn} onPress={reCenter} activeOpacity={0.8}>
        <Ionicons name="locate" size={22} color="#FFF" />
      </TouchableOpacity>
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
    bottom: 30,
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

  // ─── MARKERS ───
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: '#333',
  },

  // ─── CALLOUT ───
  calloutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5, // space for arrow
    gap: 4,
  },
  calloutBox: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#222',
  },
  calloutValue: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Raleway_700Bold',
    marginBottom: 2,
  },
  calloutLabel: {
    color: '#8a8a8a',
    fontSize: 10,
    fontFamily: 'Raleway_500Medium',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0a0a0a',
    marginTop: -2,
  },
});

