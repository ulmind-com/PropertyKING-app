import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { propertyAPI, inquiryAPI } from '../../api';

export default function PropertyLeadsScreen({ route, navigation }) {
  const property = route.params?.property || {};
  const [activeTab, setActiveTab] = useState('viewers');
  const [viewers, setViewers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [viewersRes, inquiriesRes] = await Promise.all([
        propertyAPI.getViewers(property.id),
        inquiryAPI.received({ page: 1, limit: 50 }),
      ]);
      setViewers(viewersRes.data.viewers || []);
      // Filter inquiries for this property
      const allInq = inquiriesRes.data.inquiries || [];
      setInquiries(allInq.filter(i => i.property_id === property.id));
    } catch (e) {
      console.log('Fetch leads error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const timeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getInitial = (name) => (name || 'U')[0].toUpperCase();

  const renderViewer = ({ item }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadAvatar}>
        {item.user_avatar ? (
          <Image source={{ uri: item.user_avatar }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{getInitial(item.user_name)}</Text>
        )}
      </View>
      <View style={styles.leadBody}>
        <Text style={styles.leadName}>{item.user_name || 'Anonymous'}</Text>
        <Text style={styles.leadDetail}>{item.user_email}</Text>
        {item.user_phone && <Text style={styles.leadDetail}>📱 {item.user_phone}</Text>}
        <View style={styles.viewMeta}>
          <Ionicons name="eye-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.viewCount}>Viewed {item.view_count || 1}x</Text>
          <Text style={styles.viewTime}>• {timeAgo(item.last_viewed_at)}</Text>
        </View>
      </View>
      <View style={styles.leadActions}>
        {item.user_phone && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${item.user_phone}`)}>
            <Ionicons name="call" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {item.user_phone && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => Linking.openURL(`https://wa.me/${item.user_phone?.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderInquiry = ({ item }) => (
    <View style={styles.inquiryCard}>
      <View style={styles.inquiryHeader}>
        <View style={styles.leadAvatar}>
          {item.user_avatar ? (
            <Image source={{ uri: item.user_avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{getInitial(item.user_name)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.leadName}>{item.user_name || 'User'}</Text>
          <Text style={styles.viewTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <View style={[styles.inquiryStatus, item.status === 'responded' ? styles.statusResponded : styles.statusPendingInq]}>
          <Text style={styles.inquiryStatusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.inquiryMsg} numberOfLines={3}>{item.message}</Text>
      
      {(item.preferred_date || item.preferred_time) && (
        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.scheduleText}>
            {item.preferred_date}{item.preferred_time ? ` at ${item.preferred_time}` : ''}
          </Text>
          {item.contact_preference && (
            <>
              <Ionicons name={
                item.contact_preference === 'call' ? 'call-outline' :
                item.contact_preference === 'whatsapp' ? 'logo-whatsapp' :
                item.contact_preference === 'video_call' ? 'videocam-outline' : 'people-outline'
              } size={14} color="#10B981" style={{ marginLeft: 10 }} />
              <Text style={[styles.scheduleText, { color: '#10B981' }]}>{item.contact_preference?.replace('_', ' ')}</Text>
            </>
          )}
        </View>
      )}
      
      {item.contact_phone && (
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${item.contact_phone}`)}>
            <Ionicons name="call" size={16} color="#FFF" />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#10B981' }]} onPress={() => Linking.openURL(`https://wa.me/${item.contact_phone?.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.headerSub}>Leads & Inquiries</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: '#8B5CF6' }]}>
          <Ionicons name="people" size={20} color="#8B5CF6" />
          <Text style={styles.statValue}>{viewers.length}</Text>
          <Text style={styles.statLabel}>Viewers</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#10B981' }]}>
          <Ionicons name="chatbubbles" size={20} color="#10B981" />
          <Text style={styles.statValue}>{inquiries.length}</Text>
          <Text style={styles.statLabel}>Inquiries</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.primary }]}>
          <Ionicons name="eye" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{property.views_count || 0}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'viewers' && styles.tabActive]} onPress={() => setActiveTab('viewers')}>
          <Ionicons name="people-outline" size={16} color={activeTab === 'viewers' ? '#FFF' : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'viewers' && styles.tabTextActive]}>Viewers ({viewers.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'inquiries' && styles.tabActive]} onPress={() => setActiveTab('inquiries')}>
          <Ionicons name="calendar-outline" size={16} color={activeTab === 'inquiries' ? '#FFF' : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'inquiries' && styles.tabTextActive]}>Meetings ({inquiries.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'viewers' ? (
        viewers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Viewers Yet</Text>
            <Text style={styles.emptySub}>Share your listing to attract potential buyers</Text>
          </View>
        ) : (
          <FlatList
            data={viewers}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderViewer}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          />
        )
      ) : (
        inquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Meeting Requests</Text>
            <Text style={styles.emptySub}>Interested buyers will request meetings here</Text>
          </View>
        ) : (
          <FlatList
            data={inquiries}
            keyExtractor={(item) => item.id}
            renderItem={renderInquiry}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, borderWidth: 1.5 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },

  leadCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  leadAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  leadBody: { flex: 1, marginLeft: 12, gap: 2 },
  leadName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  leadDetail: { fontSize: 12, color: COLORS.textMuted },
  viewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  viewCount: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  viewTime: { fontSize: 11, color: COLORS.textMuted },
  leadActions: { gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryLight || '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  inquiryCard: { padding: 16, marginBottom: 12, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  inquiryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  inquiryStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  statusPendingInq: { backgroundColor: '#FEF3C7' },
  statusResponded: { backgroundColor: '#D1FAE5' },
  inquiryStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  inquiryMsg: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, marginBottom: 10 },
  scheduleText: { fontSize: 12, fontWeight: '600', color: COLORS.text },

  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: SIZES.radius.md, backgroundColor: COLORS.primary },
  contactBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
