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

  const markAsDone = async (id) => {
    // Optimistic update
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'responded' } : inq));
    try {
      await inquiryAPI.respond(id, { response: 'Marked as done.' });
    } catch (e) {
      // Revert on failure
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'pending' } : inq));
      console.log('Error marking as done', e);
    }
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${m || '00'} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getContactIcon = (pref) => {
    switch(pref) {
      case 'call': return 'call';
      case 'whatsapp': return 'logo-whatsapp';
      case 'video_call': return 'videocam';
      case 'in_person': return 'people';
      default: return 'chatbubble';
    }
  };

  const getContactLabel = (pref) => {
    switch(pref) {
      case 'call': return 'Phone Call';
      case 'whatsapp': return 'WhatsApp';
      case 'video_call': return 'Video Call';
      case 'in_person': return 'In Person';
      default: return pref || 'Not specified';
    }
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
        {item.user_email && <Text style={styles.leadDetail}>✉️ {item.user_email}</Text>}
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
      {/* Header with user info */}
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

      {/* Message */}
      <Text style={styles.inquiryMsg}>{item.message}</Text>

      {/* Full Details Section */}
      <View style={styles.detailsBox}>
        {/* User Email */}
        {item.user_email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={15} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.user_email}</Text>
          </View>
        )}

        {/* Contact Phone */}
        {item.contact_phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={15} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.contact_phone}</Text>
          </View>
        )}

        {/* Preferred Date */}
        {item.preferred_date && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={15} color="#F59E0B" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.preferred_date)}</Text>
          </View>
        )}

        {/* Preferred Time */}
        {item.preferred_time && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={15} color="#8B5CF6" />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formatTime(item.preferred_time)}</Text>
          </View>
        )}

        {/* Contact Preference */}
        {item.contact_preference && (
          <View style={styles.detailRow}>
            <Ionicons name={getContactIcon(item.contact_preference)} size={15} color="#10B981" />
            <Text style={styles.detailLabel}>Contact via:</Text>
            <Text style={[styles.detailValue, { color: '#10B981', fontFamily: 'Raleway_700Bold' }]}>{getContactLabel(item.contact_preference)}</Text>
          </View>
        )}

        {/* Inquiry Type */}
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={15} color={COLORS.textMuted} />
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{(item.inquiry_type || 'general').replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.contactRow}>
        {item.contact_phone && (
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${item.contact_phone}`)}>
            <Ionicons name="call" size={16} color="#FFF" />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
        )}
        {item.contact_phone && (
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#10B981' }]} onPress={() => Linking.openURL(`https://wa.me/${item.contact_phone?.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'responded' && (
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: COLORS.bgAlt }]} onPress={() => markAsDone(item.id)}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.primary} />
            <Text style={[styles.contactBtnText, { color: COLORS.primary }]}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
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
  headerTitle: { fontSize: 16, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'Raleway_500Medium' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, borderWidth: 1.5 },
  statValue: { fontSize: 20, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text },
  statLabel: { fontSize: 10, fontFamily: 'Raleway_700Bold', color: COLORS.textMuted },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },

  leadCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  leadAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44 },
  avatarText: { fontSize: 18, fontFamily: 'Raleway_800ExtraBold', color: '#FFF' },
  leadBody: { flex: 1, marginLeft: 12, gap: 2 },
  leadName: { fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  leadDetail: { fontSize: 12, color: COLORS.textMuted },
  viewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  viewCount: { fontSize: 11, fontFamily: 'Raleway_600SemiBold', color: COLORS.textSecondary },
  viewTime: { fontSize: 11, color: COLORS.textMuted },
  leadActions: { gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryLight || '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  inquiryCard: { padding: 16, marginBottom: 14, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  inquiryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  inquiryStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  statusPendingInq: { backgroundColor: '#FEF3C7' },
  statusResponded: { backgroundColor: '#D1FAE5' },
  inquiryStatusText: { fontSize: 10, fontFamily: 'Raleway_700Bold', textTransform: 'capitalize' },
  inquiryMsg: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12, backgroundColor: COLORS.bgAlt, padding: 12, borderRadius: SIZES.radius.md },

  // Detailed info box
  detailsBox: { backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, padding: 14, marginBottom: 12, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted, minWidth: 75 },
  detailValue: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.text, flex: 1 },

  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: SIZES.radius.md, backgroundColor: COLORS.primary },
  contactBtnText: { fontSize: 13, fontFamily: 'Raleway_700Bold', color: '#FFF' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
