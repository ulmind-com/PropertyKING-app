import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../theme';
import { propertyAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';

export default function PropertyListingScreen({ navigation, route }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const params = route?.params || {};
  const mode = params.mode;

  // Single ref — a boolean lock. True = a load is already running.
  const isFetchingRef = useRef(false);
  const currentPageRef = useRef(1);

  const fetchProperties = async (p, fresh = false) => {
    if (isFetchingRef.current) return; // Hard lock — nothing gets through while a fetch is running
    isFetchingRef.current = true;

    if (fresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let res;
      if (mode === 'nearby' && params.userCoords) {
        res = await propertyAPI.nearby({ lat: params.userCoords.lat, lng: params.userCoords.lng, radius_miles: 25, page: p, limit: 10 });
      } else if (mode === 'top-viewed') {
        // Genuine most-viewed first (backend returns only views > 0)
        res = await propertyAPI.topViewed({ page: p, limit: 10 });
      } else if (mode === 'featured') {
        // Featured = browse all, newest first
        res = await propertyAPI.list({ page: p, limit: 10, sort_by: 'created_at', sort_order: 'desc' });
      } else {
        const { mode: _, userCoords, typeName, ...filterParams } = params;
        res = await propertyAPI.list({ page: p, limit: 10, ...filterParams });
      }

      const newItems = res.data?.properties || [];
      const apiTotal = res.data?.total || 0;
      const apiTotalPages = res.data?.total_pages || 1;

      setTotal(apiTotal);
      setHasMore(p < apiTotalPages); // Use total_pages from API — the real source of truth

      if (fresh) {
        setProperties(newItems);
      } else {
        setProperties(prev => [...prev, ...newItems]);
      }
    } catch (e) {
      console.log('[PropertyListing] fetch error:', e);
    } finally {
      isFetchingRef.current = false; // Always unlock
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Reset and load fresh on params change
  useEffect(() => {
    isFetchingRef.current = false;
    currentPageRef.current = 1;
    setHasMore(true);
    setProperties([]);
    fetchProperties(1, true);
  }, [JSON.stringify(params)]);

  const handleLoadMore = () => {
    if (isFetchingRef.current) return;
    if (!hasMore) return;
    const nextPage = currentPageRef.current + 1;
    currentPageRef.current = nextPage;
    fetchProperties(nextPage, false);
  };

  const handleRefresh = () => {
    isFetchingRef.current = false;
    currentPageRef.current = 1;
    setHasMore(true);
    setRefreshing(true);
    fetchProperties(1, true);
  };

  const title =
    mode === 'nearby' ? 'Near You' :
    mode === 'top-viewed' ? 'Top Viewed' :
    mode === 'featured' ? 'Featured' :
    (params.typeName || 'Properties');

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={FONTS.h3}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Filters')} style={s.filterIcon}>
          <Ionicons name="options-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {!loading && <Text style={s.count}>{total} properties found</Text>}

      {/* Loading skeleton */}
      {loading ? (
        <View style={{ flex: 1, padding: 20, gap: 12 }}>
          {[1, 2, 3].map(i => <PropertyCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item, idx) => item.id ? item.id.toString() : `prop_${idx}`}
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate('PropertyDetails', {
                slug: item.slug || item.id,
                property: item,
                userCoords: route.params?.userCoords
              })}
              style={{ marginHorizontal: 20 }}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={s.footer}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={[FONTS.caption, { marginTop: 6 }]}>Loading more...</Text>
              </View>
            ) : !hasMore && properties.length > 0 ? (
              <Text style={s.endText}>✓ You've seen all {total} properties</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={FONTS.body}>No properties found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  count: { ...FONTS.caption, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingBottom: 120 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  footer: { padding: 20, alignItems: 'center', gap: 4 },
  endText: { textAlign: 'center', padding: 20, ...FONTS.caption, color: COLORS.textMuted },
});
