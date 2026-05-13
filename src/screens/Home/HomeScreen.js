import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, FlatList, Dimensions, Animated, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { HomeSkeleton, NearbyCardSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

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

  // Track IDs already used in previous sections to prevent duplicates
  const usedIdsRef = useRef(new Set());

  useEffect(() => { initialLoad(); }, []);

  const initialLoad = async () => {
    setLoading(true);
    usedIdsRef.current = new Set();
    await loadTypes();
    // Load sequentially so each section can exclude previous section's IDs
    await loadNearby();
    await loadTopViewed();
    await loadFeatured();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    usedIdsRef.current = new Set();
    await loadTypes();
    await loadNearby(userCoords ? userCoords : null);
    await loadTopViewed();
    await loadFeatured();
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
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const [geo] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        if (geo) setLocationName(`${geo.city || ''}, ${geo.region || ''}`);
      } else {
        if (customName) setLocationName(customName.split(',')[0]);
      }
      setUserCoords(coords);
      const res = await propertyAPI.nearby({ lat: coords.lat, lng: coords.lng, radius_miles: 12.4, limit: 10 });
      const props = res.data?.properties || [];
      setNearbyProps(props);
      // Track these IDs so Top Viewed and Featured don't repeat them
      props.forEach(p => usedIdsRef.current.add(p.id));
    } catch(e) { setLocationName('Unknown'); }
  };

  const loadTopViewed = async () => {
    try {
      const excludeStr = Array.from(usedIdsRef.current).join(',');
      const r = await propertyAPI.topViewed({ limit: 10, exclude_ids: excludeStr || undefined });
      const props = r.data?.properties || [];
      setTopViewedProps(props);
      // Track these IDs so Featured doesn't repeat them
      props.forEach(p => usedIdsRef.current.add(p.id));
    } catch(e) {}
  };

  const loadFeatured = async () => {
    try {
      const excludeStr = Array.from(usedIdsRef.current).join(',');
      const r = await propertyAPI.recommendations({ limit: 10, exclude_ids: excludeStr || undefined });
      const props = r.data?.properties || [];
      setFeaturedProps(props);
      props.forEach(p => usedIdsRef.current.add(p.id));
    } catch(e) {}
  };

  const openLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      currentLat: userCoords?.lat,
      currentLng: userCoords?.lng,
      onSelectLocation: async (loc) => {
        usedIdsRef.current = new Set();
        await loadNearby({ lat: loc.lat, lng: loc.lng }, loc.address);
        await loadTopViewed();
        await loadFeatured();
      }
    });
  };

  const handleSearch = () => {
    if (searchText.trim()) navigation.navigate('PropertyListing', { search: searchText });
  };

  const formatPrice = (p, u) => {
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p || 0);
    return u === 'per_month' ? `${f}/mo` : f;
  };

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

        {/* 📍 Near You */}
        {nearbyProps.length > 0 && (
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
            {nearbyProps.slice(0, 5).map(item => (
              <PropertyCard key={item.id} property={item} onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })} />
            ))}
          </View>
        )}

        {/* 🔥 Top Viewed */}
        {topViewedProps.length > 0 && (
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
            <FlatList
              data={topViewedProps}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{gap:16}}
              keyExtractor={i => i.id}
              renderItem={({item}) => (
                <View style={st.topViewedCard}>
                  <PropertyCard key={item.id} property={item} onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords })} style={{width:width*0.72}} />
                  <View style={st.viewsBadge}>
                    <Ionicons name="eye" size={12} color="#FFF" />
                    <Text style={st.viewsBadgeText}>{item.views_count || 0} views</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* ⭐ Featured */}
        {featuredProps.length > 0 && (
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <View style={st.sectionTitleRow}>
                <View style={[st.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="star" size={16} color="#10B981" />
                </View>
                <Text style={FONTS.h3}>Featured</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PropertyListing')}>
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProps}
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

  // Near You card (horizontal list item)
  nearCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radius.md, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm, position: 'relative' },
  nearImg: { width: 115, height: 115 },
  nearInfo: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  nearTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 18 },
  nearLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearLoc: { fontSize: 11, color: COLORS.textMuted },
  nearStats: { flexDirection: 'row', gap: 10, marginTop: 2 },
  nearStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearStatTxt: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  nearPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  nearHeart: { position: 'absolute', top: 8, right: 8 },
});
