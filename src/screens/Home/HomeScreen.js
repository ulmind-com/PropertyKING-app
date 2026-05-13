import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, Animated, StatusBar, RefreshControl, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import Shimmer, { HomeSkeleton } from '../../components/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const CACHE_KEY = 'pk_home_cache';

// Icon map for property types
const TYPE_ICONS = {
  'house': 'home-outline',
  'condo': 'business-outline',
  'apartment': 'grid-outline',
  'townhouse': 'albums-outline',
  'villa': 'home-outline',
  'hotel': 'bed-outline',
  'studio': 'cube-outline',
  'land': 'map-outline',
  'commercial': 'storefront-outline',
  'office': 'briefcase-outline',
};

const getTypeIcon = (name) => {
  const key = (name || '').toLowerCase();
  return TYPE_ICONS[key] || 'home-outline';
};

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

  // ── CACHE-FIRST: Show cached data instantly, then refresh in background ──
  const loadCacheThenFresh = async () => {
    // Step 1: Try to load cached data INSTANTLY
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
        setLoading(false); // Show cached content immediately — NO skeleton
      }
    } catch (e) {}

    // Step 2: Fetch fresh data in background
    fetchFreshData();
  };

  const fetchFreshData = async () => {
    // Fire everything in parallel
    const typesPromise = loadTypes();
    const featuredPromise = propertyAPI.recommendations({ limit: 15 }).catch(() => null);
    const topViewedPromise = propertyAPI.topViewed({ limit: 15 }).catch(() => null);

    // Start location-based fetch (doesn't block)
    loadNearby();

    try {
      const [featRes, topRes] = await Promise.all([featuredPromise, topViewedPromise]);
      if (featRes) setFeaturedProps(featRes.data?.properties || []);
      if (topRes) setTopViewedProps(topRes.data?.properties || []);

      // Save to cache for next app open
      saveCache(featRes?.data?.properties, topRes?.data?.properties);
    } catch (e) {
      console.log('Error fetching fresh data:', e);
    }

    setLoading(false);
  };

  const saveCache = async (featured, topViewed) => {
    try {
      const data = {
        nearby: nearbyProps,
        featured: featured || featuredProps,
        topViewed: topViewed || topViewedProps,
        types: propertyTypes,
        locationName,
        userCoords,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const featuredPromise = propertyAPI.recommendations({ limit: 15 }).catch(() => null);
    const topViewedPromise = propertyAPI.topViewed({ limit: 15 }).catch(() => null);
    loadNearby(userCoords ? userCoords : null);

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

        // Use last known first for speed, then get current
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const [geo] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        if (geo) setLocationName(`${geo.city || ''}, ${geo.region || ''}`);
      } else {
        if (customName) setLocationName(customName.split(',')[0]);
      }
      setUserCoords(coords);
      const res = await propertyAPI.nearby({ lat: coords.lat, lng: coords.lng, radius_miles: 25, limit: 15 });
      setNearbyProps(res.data?.properties || []);

      // Update cache with nearby data
      saveCache();
    } catch(e) { setLocationName('Unknown'); }
  };

  const openLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      currentLat: userCoords?.lat,
      currentLng: userCoords?.lng,
      onSelectLocation: async (loc) => {
        await loadNearby({ lat: loc.lat, lng: loc.lng }, loc.address);
      }
    });
  };

  const handleSearch = () => {
    if (searchText.trim()) navigation.navigate('PropertyListing', { search: searchText });
  };

  // --- FRONTEND DEDUPLICATION ---
  const finalNearby = nearbyProps.slice(0, 5);
  const nearbyIds = new Set(finalNearby.map(p => p.id));
  const finalFeatured = featuredProps.filter(p => !nearbyIds.has(p.id)).slice(0, 5);
  const featuredIds = new Set(finalFeatured.map(p => p.id));
  const finalTopViewed = topViewedProps.filter(p => !nearbyIds.has(p.id) && !featuredIds.has(p.id)).slice(0, 5);

  // Greeting based on time
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  if (loading) return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={st.headerGradient}>
        <View style={st.greetRow}>
          <View style={st.avatarWrap}>
            <Ionicons name="person" size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.greetLabel}>{getGreeting()}</Text>
            <Text style={st.greetName}>Loading...</Text>
          </View>
        </View>
      </LinearGradient>
      <HomeSkeleton />
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ─── GRADIENT HEADER ─── */}
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]} style={st.headerGradient}>
        {/* Greeting Row */}
        <View style={st.greetRow}>
          <TouchableOpacity style={st.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={st.avatarImg} />
            ) : (
              <Ionicons name="person" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.greetLabel}>{getGreeting()}</Text>
            <Text style={st.greetName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={st.notifBtn} onPress={openLocationPicker}>
            <Ionicons name="location-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={st.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={st.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={st.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {locationName !== 'Detecting...' && (
            <TouchableOpacity style={st.locChip} onPress={openLocationPicker}>
              <Ionicons name="location" size={12} color={COLORS.text} />
              <Text style={st.locChipText} numberOfLines={1}>{locationName?.split(',')[0]}</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.filterBtn} onPress={() => navigation.navigate('Filters')}>
            <Ionicons name="options" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
      >
        {/* ─── CATEGORY GRID ─── */}
        {propertyTypes.length > 0 && (
          <View style={st.categoryCard}>
            <View style={st.categoryGrid}>
              {propertyTypes.slice(0, 4).map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={st.categoryItem}
                  onPress={() => { setSelectedType(t.id); navigation.navigate('PropertyListing', { property_type_id: t.id, typeName: t.name }); }}
                  activeOpacity={0.7}
                >
                  <View style={st.categoryIconWrap}>
                    <Ionicons name={getTypeIcon(t.name)} size={22} color={COLORS.text} />
                  </View>
                  <Text style={st.categoryLabel} numberOfLines={1}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {propertyTypes.length > 4 && (
              <TouchableOpacity 
                style={st.allCategoryBtn}
                onPress={() => navigation.navigate('PropertyListing')}
              >
                <Text style={st.allCategoryText}>All Category</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ─── HORIZONTAL TYPE CHIPS ─── */}
        {propertyTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.typeChipsScroll}>
            {propertyTypes.map(t => (
              <TouchableOpacity key={t.id} style={[st.typeChip, selectedType === t.id && st.typeChipActive]}
                onPress={() => { setSelectedType(selectedType === t.id ? null : t.id); navigation.navigate('PropertyListing', { property_type_id: t.id }); }}>
                <Text style={st.typeIcon}>{t.icon || '🏠'}</Text>
                <Text style={[st.typeText, selectedType === t.id && st.typeTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ─── 1. 📍 Near You ─── */}
        {finalNearby.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#F5F5F5' }]}>
                  <Ionicons name="location" size={16} color={COLORS.text} />
                </View>
                <Text style={FONTS.h3}>Near You</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { mode: 'nearby', userCoords })}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {finalNearby.map(item => (
              <PropertyCard key={item.id} property={item} onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })} />
            ))}
          </View>
        )}

        {/* ─── 2. ⭐ Featured ─── */}
        {finalFeatured.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#F5F5F5' }]}>
                  <Ionicons name="star" size={16} color={COLORS.text} />
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
              contentContainerStyle={{gap:16}}
              keyExtractor={i => i.id}
              renderItem={({item}) => (
                <PropertyCard key={item.id} property={item} onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })} style={{width:width*0.72}} />
              )}
            />
          </View>
        )}

        {/* ─── 3. 🔥 Top Viewed ─── */}
        {finalTopViewed.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#F5F5F5' }]}>
                  <Ionicons name="trending-up" size={16} color={COLORS.text} />
                </View>
                <Text style={FONTS.h3}>Top Viewed</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { mode: 'top-viewed' })}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {finalTopViewed.map(item => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <PropertyCard property={item} onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ─── GRADIENT HEADER ───
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  greetLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  greetName: { fontSize: 18, color: '#FFF', fontWeight: '800', marginTop: 2 },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // ─── SEARCH BAR ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    marginTop: 20,
    gap: 10,
    ...SHADOWS.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locChipText: { fontSize: 11, fontWeight: '700', color: COLORS.text, maxWidth: 60 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── CATEGORY GRID ───
  categoryCard: {
    margin: 20,
    marginTop: 20,
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
    width: (width - 80) / 4,
    gap: 8,
  },
  categoryIconWrap: {
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
  allCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  allCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ─── TYPE CHIPS ───
  typeChipsScroll: { paddingHorizontal: 20, gap: 10, paddingVertical: 4, marginBottom: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.radius.full,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeIcon: { fontSize: 16 },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: '#FFF' },

  // ─── SECTIONS ───
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.text, textDecorationLine: 'underline' },
});
