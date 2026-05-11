import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';

// Only import MapView on native platforms, otherwise use a fallback
let MapView = null;
if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
}

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
    updateAddress(newRegion.latitude, newRegion.longitude);
  };

  const confirmLocation = () => {
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
      />

      {/* Fixed Pin in Center */}
      <View style={s.centerPinMarker}>
        <View style={s.pin}>
          <Ionicons name="location" size={40} color={COLORS.primary} />
        </View>
      </View>

      {/* Header Overlay */}
      <SafeAreaView style={s.headerOverlay} pointerEvents="box-none">
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.circleBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={[FONTS.h3, { color: '#000', textShadowColor: '#FFF', textShadowRadius: 10 }]}>Select Location</Text>
          <TouchableOpacity onPress={locateUser} style={s.circleBtn}>
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  
  centerPinMarker: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40, alignItems: 'center', justifyContent: 'center' },
  pin: { alignItems: 'center', justifyContent: 'center' },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, ...SHADOWS.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  addressBox: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addressTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  addressDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  
  btn: { backgroundColor: COLORS.primary, height: 54, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.primary },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
});
