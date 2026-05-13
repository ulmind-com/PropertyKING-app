import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, Animated, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { HomeSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const CACHE_KEY = 'pk_home_cache';

export default function HomeScreen({ navigation }) {
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
  // Sequence: Near You -> Featured -> Top Viewed

  // 1. Near You uses all its items
  const finalNearby = nearbyProps.slice(0, 5);
  const nearbyIds = new Set(finalNearby.map(p => p.id));

  // 2. Featured excludes Near You items
  const finalFeatured = featuredProps.filter(p => !nearbyIds.has(p.id)).slice(0, 5);
  const featuredIds = new Set(finalFeatured.map(p => p.id));

  // 3. Top Viewed excludes both Near You and Featured items
  const finalTopViewed = topViewedProps.filter(p => !nearbyIds.has(p.id) && !featuredIds.has(p.id)).slice(0, 5);

  if (loading) return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={st.headerArea}>
        <View style={st.topRow}><Ionicons name="menu" size={24} color={COLORS.text} /><View style={{flex:1,alignItems:'center'}}><Text style={st.locLabel}>Location</Text><Text style={st.locText}>Detecting...</Text></View><Ionicons name="notifications-outline" size={24} color={COLORS.text} /></View>
      </View>
      <HomeSkeleton />
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={st.headerArea}>
        <View style={st.topRow}>
          <TouchableOpacity><Ionicons name="menu" size={24} color={COLORS.text} /></TouchableOpacity>
          <TouchableOpacity style={st.locBtn} onPress={openLocationPicker}>
            <Text style={st.locLabel}>Location</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={st.locText}>{locationName}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color={COLORS.text} /></TouchableOpacity>
        </View>
        {/* Search */}
        <View style={st.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput style={st.searchInput} placeholder="Search properties..." placeholderTextColor={COLORS.textMuted} value={searchText} onChangeText={setSearchText} onSubmitEditing={handleSearch} returnKeyType="search" />
          <TouchableOpacity style={st.filterBtn} onPress={() => navigation.navigate('Filters')}>
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
      >
        {/* Property Types */}
        {propertyTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20,gap:10,paddingVertical:12}}>
            {propertyTypes.map(t => (
              <TouchableOpacity key={t.id} style={[st.typeChip, selectedType===t.id && st.typeChipActive]}
                onPress={() => { setSelectedType(selectedType===t.id?null:t.id); navigation.navigate('PropertyListing',{property_type_id:t.id}); }}>
                <Text style={st.typeIcon}>{t.icon||'🏠'}</Text>
                <Text style={[st.typeText, selectedType===t.id && st.typeTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 1. 📍 Near You */}
        {finalNearby.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
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

        {/* 2. ⭐ Featured */}
        {finalFeatured.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="star" size={16} color="#10B981" />
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

        {/* 3. 🔥 Top Viewed */}
        {finalTopViewed.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="trending-up" size={16} color="#F59E0B" />
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
  headerArea: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8, backgroundColor: COLORS.bg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locBtn: { flex: 1, alignItems: 'center' },
  locLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  locText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, paddingHorizontal: 16, height: 48, marginTop: 16, gap: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },

  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeIcon: { fontSize: 16 },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: '#FFF' },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Top Viewed card overlay
  topViewedCard: { position: 'relative' },
  viewsBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  viewsBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
});
