import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme';
import { propertyAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';

export default function PropertyListingScreen({ navigation, route }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const params = route?.params || {};
  const mode = params.mode; // 'nearby' | 'top-viewed' | 'featured' | undefined

  // Use refs for pagination state so onEndReached always reads the latest values
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    load(1, true);
  }, [JSON.stringify(params)]);

  const load = async (p = 1, fresh = false) => {
    if (fresh) setLoading(true);
    try {
      let res;
      if (mode === 'nearby' && params.userCoords) {
        res = await propertyAPI.nearby({ lat: params.userCoords.lat, lng: params.userCoords.lng, radius_miles: 25, page: p, limit: 10 });
      } else if (mode === 'top-viewed') {
        res = await propertyAPI.topViewed({ page: p, limit: 10 });
      } else if (mode === 'featured') {
        res = await propertyAPI.recommendations({ page: p, limit: 10 });
      } else {
        const { mode: _, userCoords, typeName, ...filterParams } = params;
        res = await propertyAPI.list({ page: p, limit: 10, ...filterParams });
      }
      const newProps = res.data?.properties || [];
      setTotal(res.data?.total || 0);
      hasMoreRef.current = newProps.length >= 10;
      if (fresh || p === 1) {
        setProperties(newProps);
      } else {
        setProperties(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const unique = newProps.filter(item => !existingIds.has(item.id));
          return [...prev, ...unique];
        });
      }
    } catch(e) { console.log('Load error:', e); }
    setLoading(false);
    setLoadingMore(false);
    loadingMoreRef.current = false;
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    load(1, true);
  }, []);

  const onEndReached = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    load(nextPage, false);
  }, [mode, JSON.stringify(params)]);

  const title = mode === 'nearby' ? 'Near You' : mode === 'top-viewed' ? 'Top Viewed' : mode === 'featured' ? 'Featured' : (params.typeName || 'Properties');

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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

      <FlatList
        data={loading ? [] : properties}
        keyExtractor={(item, idx) => item.id ? item.id.toString() : `prop_${idx}`}
        style={{ flex: 1 }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <PropertyCard property={item}
            onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item, userCoords: route.params?.userCoords })}
            style={{ marginHorizontal: 20 }}
          />
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={{padding:20,alignItems:'center'}}><ActivityIndicator color={COLORS.primary} /></View>
          ) : !hasMoreRef.current && properties.length > 0 && !loading ? (
            <Text style={s.endText}>You've seen all properties</Text>
          ) : (
            <View style={{height: 20}} />
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={{padding:20,gap:12}}>
              {[1,2,3].map(i => <PropertyCardSkeleton key={i} />)}
            </View>
          ) : (
            <View style={s.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={FONTS.body}>No properties found</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  count: { ...FONTS.caption, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  endText: { textAlign: 'center', padding: 20, ...FONTS.caption },
});
