import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { inquiryAPI } from '../../api';

export default function AllInquiriesScreen({ navigation }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchData = async () => {
    try {
      const params = { page: 1, limit: 100 };
      if (activeFilter !== 'all') params.status = activeFilter;
      
      const res = await inquiryAPI.received(params);
      setInquiries(res.data.inquiries || []);
    } catch (e) {
      console.log('Fetch inquiries error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [activeFilter]);

  const markAsDone = async (id) => {
    try {
      // In the backend, there's a respond route. Or maybe we just need a status update route?
      // Wait, backend has PUT /{inquiry_id}/respond which sets status to 'responded'
      await inquiryAPI.respond(id, { response: "Marked as done." });
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'responded' } : inq));
    } catch (e) {
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
    } catch { return dateStr; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${m || '00'} ${ampm}`;
    } catch { return timeStr; }
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

  const renderInquiry = ({ item }) => (
    <View style={styles.inquiryCard}>
      {/* Property Context Header */}
      <View style={styles.propertyHeader}>
        <View style={styles.propIconBox}><Ionicons name="home" size={16} color={COLORS.primary}/></View>
        <Text style={styles.propTitle} numberOfLines={1}>{item.property_title || 'Unknown Property'}</Text>
        <View style={[styles.statusBadge, item.status === 'responded' ? styles.statusDone : styles.statusPending]}>
          <Text style={styles.statusText}>{item.status === 'responded' ? 'Done' : 'Pending'}</Text>
        </View>
      </View>

      {/* User Info & Message */}
      <View style={styles.userInfoRow}>
        <View style={styles.avatar}>
          {item.user_avatar ? <Image source={{uri: item.user_avatar}} style={styles.avatarImg}/> : <Text style={styles.avatarText}>{(item.user_name||'U')[0]}</Text>}
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.userName}>{item.user_name || 'User'}</Text>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.inquiryMsg}>"{item.message}"</Text>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        {item.contact_phone && (
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color={COLORS.textMuted}/>
            <Text style={styles.detailText}>{item.contact_phone}</Text>
          </View>
        )}
        {item.preferred_date && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#F59E0B"/>
            <Text style={styles.detailText}>{formatDate(item.preferred_date)}</Text>
          </View>
        )}
        {item.preferred_time && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#8B5CF6"/>
            <Text style={styles.detailText}>{formatTime(item.preferred_time)}</Text>
          </View>
        )}
        {item.contact_preference && (
          <View style={styles.detailItem}>
            <Ionicons name={getContactIcon(item.contact_preference)} size={14} color="#10B981"/>
            <Text style={styles.detailText}>{getContactLabel(item.contact_preference)}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {item.contact_phone && (
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.primary}]} onPress={() => Linking.openURL(`tel:${item.contact_phone}`)}>
            <Ionicons name="call" size={16} color="#FFF"/>
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        )}
        {item.contact_phone && (
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]} onPress={() => Linking.openURL(`https://wa.me/${item.contact_phone?.replace(/\D/g, '')}`)}>
            <Ionicons name="logo-whatsapp" size={16} color="#FFF"/>
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'responded' && (
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight}]} onPress={() => markAsDone(item.id)}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.primary}/>
            <Text style={[styles.actionBtnText, {color: COLORS.primary}]}>Mark Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={FONTS.h3}>All Inquiries</Text>
        <View style={{width: 40}}/>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]} onPress={() => setActiveFilter('all')}>
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'pending' && styles.filterBtnActive]} onPress={() => setActiveFilter('pending')}>
          <Text style={[styles.filterText, activeFilter === 'pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'responded' && styles.filterBtnActive]} onPress={() => setActiveFilter('responded')}>
          <Text style={[styles.filterText, activeFilter === 'responded' && styles.filterTextActive]}>Done</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary}/></View>
      ) : inquiries.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={60} color={COLORS.border}/>
          <Text style={{...FONTS.h4, marginTop: 16}}>No Inquiries Found</Text>
          <Text style={{color: COLORS.textMuted, marginTop: 8}}>You have no {activeFilter !== 'all' ? activeFilter : ''} inquiries right now.</Text>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={i => i.id}
          renderItem={renderInquiry}
          contentContainerStyle={{padding: 16, paddingBottom: 40}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, backgroundColor: '#FFF', ...SHADOWS.sm },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  
  filterRow: { flexDirection: 'row', padding: 16, gap: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted },
  filterTextActive: { color: '#FFF' },

  inquiryCard: { backgroundColor: '#FFF', borderRadius: SIZES.radius.lg, padding: 16, marginBottom: 16, ...SHADOWS.md },
  propertyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  propIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  propTitle: { flex: 1, fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusDone: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 10, fontFamily: 'Raleway_800ExtraBold', color: COLORS.textDark },

  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: '#FFF', fontFamily: 'Raleway_700Bold', fontSize: 16 },
  userName: { fontSize: 15, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  timeText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  inquiryMsg: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', backgroundColor: COLORS.bgAlt, padding: 12, borderRadius: 8, marginBottom: 16 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  detailText: { fontSize: 12, fontFamily: 'Raleway_600SemiBold', color: COLORS.text },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontFamily: 'Raleway_700Bold' },
});
