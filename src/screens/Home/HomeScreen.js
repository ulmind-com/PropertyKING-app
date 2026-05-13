import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Dimensions, Animated, StatusBar, RefreshControl, Image, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import Shimmer, { HomeSkeleton } from '../../components/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const CACHE_KEY = 'pk_home_cache';

// Ionicons map for property type names
const TYPE_ICON_MAP = {
  house: 'home-outline',
  villa: 'home-outline',
  condo: 'business-outline',
  apartment: 'grid-outline',
  'apt.': 'grid-outline',
  townhouse: 'albums-outline',
  hotel: 'bed-outline',
  studio: 'cube-outline',
  land: 'map-outline',
  commercial: 'storefront-outline',
  office: 'briefcase-outline',
};
const getTypeIcon = (name = '') => TYPE_ICON_MAP[name.toLowerCase()] || 'home-outline';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [nearbyProps, setNearbyProps] = useState([]);
  const [topViewedProps, setTopViewedProps] = useState([]);
  const [featuredProps, setFeaturedProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [locationName, setLocationName] = useState('Detecting...');
  const [userCoords, setUserCoords] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadCacheThenFresh(); }, []);

  const loadCacheThenFresh = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setNearbyProps(data.nearby || []);
        setFeaturedProps(data.featured || []);
        setTopViewedProps(data.topViewed || []);
        setPropertyTypes(data.types || []);
        if (data.locationName) setLocationName(data.locationName);
        if (data.userCoords) setUserCoords(data.userCoords);
        setLoading(false);
      }
    } catch (e) {}
    fetchFreshData();
  };

  const fetchFreshData = async () => {
    const typesPromise = loadTypes();
    const featuredPromise = propertyAPI.recommendations({ limit: 15 }).catch(() => null);
    const topViewedPromise = propertyAPI.topViewed({ limit: 15 }).catch(() => null);
    loadNearby();
    try {
      const [featRes, topRes] = await Promise.all([featuredPromise, topViewedPromise]);
      if (featRes) setFeaturedProps(featRes.data?.properties || []);
      if (topRes) setTopViewedProps(topRes.data?.properties || []);
      saveCache(featRes?.data?.properties, topRes?.data?.properties);
    } catch (e) {}
    setLoading(false);
  };

  const saveCache = async (featured, topViewed) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        nearby: nearbyProps, featured: featured || featuredProps,
        topViewed: topViewed || topViewedProps, types: propertyTypes,
        locationName, userCoords, savedAt: Date.now(),
      }));
    } catch (e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const featuredPromise = propertyAPI.recommendations({ limit: 15 }).catch(() => null);
    const topViewedPromise = propertyAPI.topViewed({ limit: 15 }).catch(() => null);
    loadNearby(userCoords || null);
    try {
      const [featRes, topRes] = await Promise.all([featuredPromise, topViewedPromise]);
      if (featRes) setFeaturedProps(featRes.data?.properties || []);
      if (topRes) setTopViewedProps(topRes.data?.properties || []);
      saveCache(featRes?.data?.properties, topRes?.data?.properties);
    } catch (e) {}
    setRefreshing(false);
  }, [userCoords]);

  const loadTypes = async () => {
    try { const r = await propertyTypeAPI.list(); setPropertyTypes(r.data || []); } catch(e) {}
  };

  const loadNearby = async (customCoords = null, customName = null) => {
    try {
      let coords = customCoords;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLocationName('Location denied'); return; }
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const [geo] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        if (geo) setLocationName(`${geo.city || ''}, ${geo.region || ''}`);
      } else {
        if (customName) setLocationName(customName.split(',')[0]);
      }
      setUserCoords(coords);
      const res = await propertyAPI.nearby({ lat: coords.lat, lng: coords.lng, radius_miles: 25, limit: 15 });
      setNearbyProps(res.data?.properties || []);
      saveCache();
    } catch(e) { setLocationName('Unknown'); }
  };

  const openLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      currentLat: userCoords?.lat, currentLng: userCoords?.lng,
      onSelectLocation: async (loc) => {
        await loadNearby({ lat: loc.lat, lng: loc.lng }, loc.address);
      }
    });
  };

  const handleSearch = () => {
    if (searchText.trim()) navigation.navigate('PropertyListing', { search: searchText });
  };

  // Deduplication
  const finalNearby = nearbyProps.slice(0, 5);
  const nearbyIds = new Set(finalNearby.map(p => p.id));
  const finalFeatured = featuredProps.filter(p => !nearbyIds.has(p.id)).slice(0, 5);
  const featuredIds = new Set(finalFeatured.map(p => p.id));
  const finalTopViewed = topViewedProps.filter(p => !nearbyIds.has(p.id) && !featuredIds.has(p.id)).slice(0, 5);

  if (loading) return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <View style={st.header}>
        <View style={st.headerRow}>
          <View style={st.avatarCircle}>
            <Ionicons name="person" size={18} color="#FFF" />
          </View>
          <View style={st.headerCenter}>
            <Text style={st.headerLocLabel}>Location</Text>
            <View style={st.headerLocRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={st.headerLocText}>Detecting...</Text>
            </View>
          </View>
          <View style={st.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
          </View>
        </View>
      </View>
      <HomeSkeleton />
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* ═══════════ DARK HEADER ═══════════ */}
      <View style={st.header}>
        {/* Row 1: Avatar | Location | Bell */}
        <View style={st.headerRow}>
          {/* Avatar */}
          <TouchableOpacity style={st.avatarCircle}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={st.avatarImg} />
            ) : (
              <Ionicons name="person" size={18} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* Location (center) */}
          <TouchableOpacity style={st.headerCenter} onPress={openLocationPicker}>
            <Text style={st.headerLocLabel}>Location</Text>
            <View style={st.headerLocRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              {locationName === 'Detecting...' ? (
                <Shimmer w={90} h={14} r={4} />
              ) : (
                <Text style={st.headerLocText} numberOfLines={1}>{locationName}</Text>
              )}
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
            </View>
          </TouchableOpacity>

          {/* Notification bell */}
          <TouchableOpacity style={st.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
            {/* Badge dot */}
            <View style={st.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Search Bar */}
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
          <TouchableOpacity style={st.filterBtn} onPress={() => navigation.navigate('Filters')}>
            <Ionicons name="options-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text} colors={[COLORS.text]} />}
      >
        {/* ═══════════ CATEGORY GRID CARD ═══════════ */}
        {propertyTypes.length > 0 && (
          <View style={st.categoryCard}>
            <View style={st.categoryGrid}>
              {propertyTypes.slice(0, 4).map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={st.categoryItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PropertyListing', { property_type_id: t.id, typeName: t.name })}
                >
                  <View style={st.categoryIconBox}>
                    <Ionicons name={getTypeIcon(t.name)} size={22} color={COLORS.text} />
                  </View>
                  <Text style={st.categoryLabel} numberOfLines={1}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* All Category Row */}
            <TouchableOpacity
              style={st.allCatRow}
              onPress={() => navigation.navigate('Explore')}
              activeOpacity={0.7}
            >
              <Text style={st.allCatText}>All Category</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════ TYPE CHIPS SCROLL ═══════════ */}
        {propertyTypes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.typeChipsScroll}
          >
            {propertyTypes.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[st.typeChip, selectedType === t.id && st.typeChipActive]}
                onPress={() => {
                  setSelectedType(selectedType === t.id ? null : t.id);
                  navigation.navigate('PropertyListing', { property_type_id: t.id });
                }}
              >
                <Text style={st.typeIcon}>{t.icon || '🏠'}</Text>
                <Text style={[st.typeText, selectedType === t.id && st.typeTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ═══════════ NEAR YOU ═══════════ */}
        {finalNearby.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionLeft}>
                <View style={st.sectionIconBox}>
                  <Ionicons name="location" size={14} color={COLORS.text} />
                </View>
                <Text style={FONTS.h3}>Near You</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { mode: 'nearby', userCoords })}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {finalNearby.map(item => (
              <PropertyCard
                key={item.id} property={item}
                onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })}
              />
            ))}
          </View>
        )}

        {/* ═══════════ FEATURED ═══════════ */}
        {finalFeatured.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionLeft}>
                <View style={st.sectionIconBox}>
                  <Ionicons name="star" size={14} color={COLORS.text} />
                </View>
                <Text style={FONTS.h3}>Featured</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { mode: 'featured' })}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={finalFeatured}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <PropertyCard
                  property={item}
                  onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })}
                  style={{ width: width * 0.72 }}
                />
              )}
            />
          </View>
        )}

        {/* ═══════════ TOP VIEWED ═══════════ */}
        {finalTopViewed.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionLeft}>
                <View style={st.sectionIconBox}>
                  <Ionicons name="trending-up" size={14} color={COLORS.text} />
                </View>
                <Text style={FONTS.h3}>Top Viewed</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { mode: 'top-viewed' })}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {finalTopViewed.map(item => (
              <PropertyCard
                key={item.id} property={item}
                onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </Animated.ScrollView>
    </View>
  );
}

const HEADER_BG = '#1C1C1E'; // Apple dark

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ─── DARK HEADER ───
  header: {
    backgroundColor: HEADER_BG,
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLocLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginBottom: 3 },
  headerLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerLocText: { fontSize: 14, fontWeight: '700', color: '#FFF', maxWidth: 160 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: HEADER_BG,
  },

  // ─── SEARCH ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    ...SHADOWS.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── CATEGORY GRID CARD ───
  categoryCard: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - 120) / 4,
    gap: 8,
  },
  categoryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  allCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  allCatText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ─── TYPE CHIPS ───
  typeChipsScroll: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.radius.full,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeIcon: { fontSize: 14 },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: '#FFF' },

  // ─── SECTIONS ───
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.text, opacity: 0.5 },
});
