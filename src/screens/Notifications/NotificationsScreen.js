import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { notificationAPI } from '../../api';


export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.list({ limit: 50 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      console.log('Error loading notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.log('Error marking all as read:', e);
    }
  };

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      try {
        await notificationAPI.markRead(item.id);
        setNotifications(notifications.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }

    // Context-aware Navigation
    const type = item.type;
    
    if (type === 'new_inquiry') {
      navigation.navigate('MainTabs', { screen: 'Profile', params: { screen: 'PropertyLeads' } });
      return;
    }
    
    if (type === 'inquiry_response') {
      navigation.navigate('MainTabs', { screen: 'Profile', params: { screen: 'Inquiries' } });
      return;
    }
    
    if (type === 'property_approved' || type === 'property_rejected') {
      navigation.navigate('MainTabs', { screen: 'Profile', params: { screen: 'MyListings' } });
      return;
    }

    // Default: go to PropertyDetails if property_id is present (e.g. price_drop, new_listing, etc)
    const propId = item.data?.property_id || item.data?.property_slug;
    if (propId) {
      try {
        const { propertyAPI } = require('../../api');
        
        const res = await propertyAPI.getBySlug(propId);
        if (res.data) {
          navigation.navigate('PropertyDetails', { property: res.data });
        }
      } catch (err) {
        console.log('Error loading property from notification', err);
        const Toast = require('react-native-toast-message').default;
        Toast.show({
          type: 'error',
          text1: 'Not Found',
          text2: 'This property may have been removed or is unavailable.'
        });
      }
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'inquiry': return 'chatbubble-ellipses';
      case 'status': return 'checkmark-circle';
      case 'favorite': return 'heart';
      case 'system':
      default: return 'notifications';
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[s.item, !item.is_read && s.itemUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[s.iconBox, !item.is_read && s.iconBoxUnread]}>
        <Ionicons name={getIconForType(item.type)} size={20} color={!item.is_read ? COLORS.primary : COLORS.textMuted} />
      </View>
      <View style={s.content}>
        <Text style={[s.title, !item.is_read && s.titleUnread]} numberOfLines={1}>{item.title}</Text>
        <Text style={s.body} numberOfLines={2}>{item.body}</Text>
        <Text style={s.time}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={s.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={FONTS.h3}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={s.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.border} />
              <Text style={FONTS.h3}>No notifications yet</Text>
              <Text style={s.emptySub}>When you get notifications, they'll show up here.</Text>
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
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  markReadText: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.primary },
  list: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    backgroundColor: '#FFF'
  },
  itemUnread: { backgroundColor: COLORS.primarySoft },
  iconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgAlt,
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  iconBoxUnread: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: 'Raleway_600SemiBold', color: COLORS.text, marginBottom: 4 },
  titleUnread: { fontFamily: 'Raleway_700Bold', color: COLORS.textDark },
  body: { fontSize: 13, fontFamily: 'Raleway_400Regular', color: COLORS.textSecondary, marginBottom: 6 },
  time: { fontSize: 11, fontFamily: 'Raleway_500Medium', color: COLORS.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, alignSelf: 'center', marginLeft: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptySub: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 8, fontSize: 14, fontFamily: 'Raleway_400Regular' }
});
