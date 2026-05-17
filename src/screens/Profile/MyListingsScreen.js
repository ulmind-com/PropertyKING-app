import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl, Alert } from 'react-native';
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
  const [stats, setStats] = useState({ totalProps: '-', totalViews: '-', totalInquiries: '-' });

  // Fetch stats from dedicated lightweight endpoint
  const fetchStats = async () => {
    try {
      const res = await propertyAPI.myListingsStats();
      setStats({
        totalProps: res.data.total_properties || 0,
        totalViews: res.data.total_views || 0,
        totalInquiries: res.data.total_inquiries || 0,
      });
    } catch (e) {
      console.log('Fetch stats error:', e);
    }
  };

  const fetchListings = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      const res = await propertyAPI.myListings({ page: pageNum, limit: 10 });
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

  useEffect(() => {
    // Fire both in parallel — stats loads fast, listings load separately
    fetchStats();
    fetchListings(1);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
    fetchListings(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(page + 1);
    }
  };

  // ── OPTIMISTIC UI TOGGLE ──
  const handleToggleStatus = async (item) => {
    const oldStatus = item.status;
    const newStatus = oldStatus === 'inactive' ? 'active' : 'inactive';

    // 1. Instantly update UI (optimistic)
    setListings(prev => prev.map(p =>
      p.id === item.id ? { ...p, status: newStatus } : p
    ));

    // 2. Fire API in background
    try {
      await propertyAPI.toggleStatus(item.id);
      // Refresh stats since active/inactive count changed
      fetchStats();
    } catch (e) {
      // 3. REVERT on failure
      setListings(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: oldStatus } : p
      ));
      Alert.alert('Error', 'Failed to update. Please try again.');
    }
  };

  // ── DELETE PROPERTY ──
  const handleDeleteProperty = (id) => {
    Alert.alert('Delete Property', 'Are you sure you want to permanently delete this listing? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await propertyAPI.delete(id);
            setListings(prev => prev.filter(p => p.id !== id));
            fetchStats();
            const Toast = require('react-native-toast-message').default;
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Property listing removed.' });
          } catch (e) {
            const Toast = require('react-native-toast-message').default;
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not delete property.' });
          }
      }}
    ]);
  };

  const getImg = (property) => {
    const imgs = property.images || [];
    const primary = imgs.find(i => i.is_primary);
    return primary?.url || imgs[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400';
  };

  const formatPrice = (p) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p || 0);
  };

  const renderItem = ({ item }) => {
    const isActive = item.status !== 'inactive';

    return (
      <View style={[styles.card, !isActive && styles.cardInactive]}>
        <TouchableOpacity
          style={styles.cardTouchable}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PropertyLeads', { property: item })}
        >
          <View style={styles.imgWrap}>
            <Image source={{ uri: getImg(item) }} style={styles.cardImg} />
            <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeInactive]}>
              <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
              <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="eye" size={14} color="#6366F1" />
                <Text style={styles.statText}>{item.views_count || 0}</Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons name="chatbubble" size={14} color="#10B981" />
                <Text style={styles.statText}>{item.inquiries_count || 0}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('PropertyLeads', { property: item })}
          >
            <Text style={styles.detailsBtnText}>View Leads</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => handleDeleteProperty(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleSwitch, isActive && styles.toggleSwitchActive]}
              activeOpacity={0.8}
              onPress={() => handleToggleStatus(item)}
            >
              <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Summary — OP Level UI */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
          <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.summaryValue}>{stats.totalProps}</Text>
          <Text style={styles.summaryLabel}>Listings</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F5F3FF' }]}>
          <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="eye" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.summaryValue}>{stats.totalViews}</Text>
          <Text style={styles.summaryLabel}>Views</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="chatbubbles" size={20} color="#10B981" />
          </View>
          <Text style={styles.summaryValue}>{stats.totalInquiries}</Text>
          <Text style={styles.summaryLabel}>Leads</Text>
        </View>
      </View>

      {loading && page === 1 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptySub}>List your first property to start tracking leads and views</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
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
  container: { flex: 1, backgroundColor: COLORS.bgDark },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: COLORS.bg },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text, letterSpacing: -0.5 },

  // Stats Grid
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, paddingBottom: 24, paddingTop: 16, backgroundColor: COLORS.bg },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 24, ...SHADOWS.sm },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  summaryValue: { fontSize: 24, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text, marginBottom: 2 },
  summaryLabel: { fontSize: 12, fontFamily: 'Raleway_700Bold', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Cards
  card: { backgroundColor: COLORS.bg, borderRadius: 24, marginBottom: 20, ...SHADOWS.md, padding: 12 },
  cardInactive: { opacity: 0.6 },
  cardTouchable: { flexDirection: 'row', gap: 16 },
  
  imgWrap: { position: 'relative' },
  cardImg: { width: 110, height: 110, borderRadius: 16, backgroundColor: COLORS.borderLight },
  statusBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#10B981' },
  dotInactive: { backgroundColor: '#9CA3AF' },
  statusText: { fontSize: 9, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#6B7280' },

  cardBody: { flex: 1, paddingVertical: 4 },
  cardTitle: { fontSize: 15, fontFamily: 'Raleway_700Bold', color: COLORS.text, lineHeight: 20, marginBottom: 6 },
  cardPrice: { fontSize: 18, fontFamily: 'Raleway_800ExtraBold', color: COLORS.primary, marginBottom: 12 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Raleway_700Bold' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  detailsBtnText: { fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.primary },
  deleteBtn: { padding: 4 },
  
  toggleSwitch: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', padding: 2, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: '#10B981' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', ...SHADOWS.sm },
  toggleThumbActive: { transform: [{ translateX: 22 }] },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 100 },
  emptyTitle: { fontSize: 20, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text },
  emptySub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
