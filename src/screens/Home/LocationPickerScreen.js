import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { MapView } from '../../components/Map/MapViewComponent';
import api, { propertyAPI } from '../../api';

export default function LocationPickerScreen({ navigation, route }) {
  const [region, setRegion] = useState({
    latitude: route.params?.currentLat || 22.0257,
    longitude: route.params?.currentLng || 88.0583,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [address, setAddress] = useState('Fetching address...');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  // Set when we move the map ourselves, so the resulting region change does not
  // reverse-geocode over a label the user explicitly picked.
  const skipNextRegionChange = useRef(false);

  useEffect(() => {
    if (route.params?.currentLat) {
      updateAddress(route.params.currentLat, route.params.currentLng);
    } else {
      locateUser();
    }
  }, []);

  const locateUser = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion(prev => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
      updateAddress(loc.coords.latitude, loc.coords.longitude);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      }, 1000);
    } catch (e) {
      console.log(e);
      setAddress('Unable to fetch location');
    }
    setLoading(false);
  };

  const updateAddress = async (lat, lng) => {
    setLoading(true);
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geo) {
        const parts = [geo.street, geo.city, geo.region].filter(Boolean);
        setAddress(parts.join(', ') || 'Unknown Location');
      } else {
        setAddress('Unknown Location');
      }
    } catch (e) {
      setAddress('Unknown Location');
    }
    setLoading(false);
  };

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    if (skipNextRegionChange.current) { skipNextRegionChange.current = false; return; }
    updateAddress(newRegion.latitude, newRegion.longitude);
  };

  // Suggest as the user types. Our own listing cities come first — a general
  // geocoder happily returns places we have no properties in, which lands the
  // user on an empty result page. Device geocoding only fills in on no match.
  useEffect(() => {
    const q = searchText.trim();
    if (q.length < 2) { setSuggestions([]); setSearching(false); return; }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      let results = [];
      try {
        const res = await propertyAPI.locations({ q, limit: 8 });
        results = (res.data.locations || []).map(l => ({
          label: l.label,
          sublabel: `${l.count} propert${l.count === 1 ? 'y' : 'ies'}`,
          lat: l.lat, lng: l.lng, hasListings: true,
        }));
      } catch { /* fall through to device geocoding */ }

      if (!results.length) {
        try {
          const geo = await Location.geocodeAsync(q);
          results = geo.slice(0, 5).map(g => ({
            label: q,
            sublabel: `${g.latitude.toFixed(3)}, ${g.longitude.toFixed(3)}`,
            lat: g.latitude, lng: g.longitude, hasListings: false,
          }));
        } catch { results = []; }
      }

      if (!cancelled) { setSuggestions(results); setSearching(false); }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchText]);

  const selectSuggestion = (item) => {
    setSuggestions([]);
    setSearchText('');
    if (item.lat == null || item.lng == null) { setAddress(item.label); return; }
    // Trust our own city label over a reverse lookup of a representative pin,
    // which resolves to things like "Harris County" instead of "Houston, TX".
    if (item.hasListings) {
      skipNextRegionChange.current = true;
      setAddress(item.label);
    }
    const next = {
      latitude: Number(item.lat), longitude: Number(item.lng),
      latitudeDelta: 0.15, longitudeDelta: 0.15,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 800);
    if (!item.hasListings) updateAddress(next.latitude, next.longitude);
  };

  const confirmLocation = () => {
    // Fire-and-forget: persist to backend for admin visibility
    api.put('/users/me/location', { lat: region.latitude, lon: region.longitude, name: address }).catch(() => {});

    // Pass back to previous screen
    if (route.params?.onSelectLocation) {
      route.params.onSelectLocation({
        lat: region.latitude,
        lng: region.longitude,
        address
      });
    } else {
      // Fallback if not using callback
      navigation.navigate('Home', { 
        selectedLocation: { lat: region.latitude, lng: region.longitude, address } 
      });
    }
    navigation.goBack();
  };

  if (Platform.OS === 'web') {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={FONTS.h3}>Select Location</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="map-outline" size={60} color={COLORS.textMuted} />
          <Text style={{ ...FONTS.h4, marginTop: 20, textAlign: 'center' }}>Map dragging is not supported on Web</Text>
          <Text style={{ ...FONTS.body, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 }}>Please use the mobile app or emulator to test the Zomato-style map picker.</Text>
          
          <TouchableOpacity style={[s.btn, { marginTop: 40, width: '100%' }]} onPress={confirmLocation}>
            <Text style={s.btnText}>Use Current Default Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

  return (
    <View style={s.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      />

      <View style={s.centerPinMarker}>
        <View style={s.pin}>
          <Ionicons name="location" size={40} color="#FF3B30" />
        </View>
      </View>

      {/* Header Overlay */}
      <SafeAreaView style={s.headerOverlay} pointerEvents="box-none">
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.circleBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={[FONTS.h3, { color: '#FFF', textShadowColor: '#000', textShadowRadius: 10 }]}>Select Location</Text>
          <TouchableOpacity onPress={locateUser} style={s.circleBtn}>
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {/* Search — suggests cities we actually have listings in */}
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={17} color={COLORS.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search a city — Los Angeles, Houston…"
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={() => suggestions[0] && selectSuggestion(suggestions[0])}
            />
            {searching
              ? <ActivityIndicator size="small" color={COLORS.textMuted} />
              : searchText
                ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )
                : null}
          </View>

          {(suggestions.length > 0 || (!searching && searchText.trim().length >= 2)) && (
            <View style={s.dropdown}>
              {suggestions.map((r, i) => (
                <TouchableOpacity key={i} style={s.suggestion}
                                  onPress={() => selectSuggestion(r)} activeOpacity={0.7}>
                  <Ionicons name="location" size={15}
                            color={r.hasListings ? '#22C55E' : COLORS.textMuted} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.suggestionLabel}>{r.label}</Text>
                    <Text style={[s.suggestionSub, r.hasListings && { color: '#22C55E' }]}
                          numberOfLines={1}>{r.sublabel}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {!suggestions.length && (
                <Text style={s.noMatch}>No match for “{searchText.trim()}”. Try a nearby city.</Text>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Overlay */}
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Location details</Text>
        
        <View style={s.addressBox}>
          <Ionicons name="location" size={24} color={COLORS.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <Text style={s.addressTitle}>{address.split(',')[0]}</Text>
                <Text style={s.addressDesc} numberOfLines={2}>{address}</Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={confirmLocation} disabled={loading}>
          <Text style={s.btnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, marginTop: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  searchInput: {
    flex: 1, paddingVertical: 12, marginLeft: 9,
    fontFamily: 'Raleway_500Medium', fontSize: 14, color: COLORS.text,
  },
  dropdown: {
    backgroundColor: '#FFF', borderRadius: 14, marginTop: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderLight,
  },
  suggestionLabel: { fontFamily: 'Raleway_700Bold', fontSize: 13.5, color: COLORS.text },
  suggestionSub: { fontFamily: 'Raleway_500Medium', fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  noMatch: {
    padding: 14, fontFamily: 'Raleway_500Medium', fontSize: 12.5, color: COLORS.textMuted,
  },
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  
  centerPinMarker: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40, alignItems: 'center', justifyContent: 'center' },
  pin: { alignItems: 'center', justifyContent: 'center' },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, ...SHADOWS.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontFamily: 'Raleway_700Bold', color: COLORS.text, marginBottom: 16 },
  addressBox: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addressTitle: { fontSize: 18, fontFamily: 'Raleway_700Bold', color: COLORS.text, marginBottom: 4 },
  addressDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  
  btn: { backgroundColor: COLORS.primary, height: 54, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.primary },
  btnText: { color: '#FFF', fontSize: 16, fontFamily: 'Raleway_700Bold' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
});
