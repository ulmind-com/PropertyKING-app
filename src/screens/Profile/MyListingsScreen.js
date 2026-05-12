import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { propertyAPI } from '../../api';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchListings = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      const res = await propertyAPI.myListings({ page: pageNum, limit: 5 });
      const newProps = res.data.properties || [];

      if (isRefresh || pageNum === 1) {
        setListings(newProps);
      } else {
        setListings(prev => [...prev, ...newProps]);
      }
      setHasMore(pageNum < res.data.total_pages);
      setPage(pageNum);
    } catch (e) {
      console.log('Fetch listings error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchListings(1); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(page + 1);
    }
  };

  const getImg = (property) => {
    const imgs = property.images || [];
    const primary = imgs.find(i => i.is_primary);
    return primary?.url || imgs[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400';
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p || 0);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PropertyLeads', { property: item })}
    >
      <Image source={{ uri: getImg(item) }} style={styles.cardImg} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
            <Text style={styles.statText}>{item.views_count || 0} views</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="chatbubble-outline" size={14} color="#10B981" />
            <Text style={styles.statText}>{item.inquiries_count || 0} inquiries</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'approved' ? styles.statusApproved : item.status === 'pending' ? styles.statusPending : styles.statusRejected]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} style={{ alignSelf: 'center', marginRight: 12 }} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="home" size={22} color={COLORS.primary} />
          <Text style={styles.summaryValue}>{listings.length}</Text>
          <Text style={styles.summaryLabel}>Properties</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="eye" size={22} color="#8B5CF6" />
          <Text style={styles.summaryValue}>{listings.reduce((a, b) => a + (b.views_count || 0), 0)}</Text>
          <Text style={styles.summaryLabel}>Total Views</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="chatbubbles" size={22} color="#10B981" />
          <Text style={styles.summaryValue}>{listings.reduce((a, b) => a + (b.inquiries_count || 0), 0)}</Text>
          <Text style={styles.summaryLabel}>Inquiries</Text>
        </View>
      </View>

      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptySub}>List your first property to start tracking leads</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  summaryValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  card: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  cardImg: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  statusApproved: { backgroundColor: '#D1FAE5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
