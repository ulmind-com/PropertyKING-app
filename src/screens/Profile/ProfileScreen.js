import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_SCREENS = ['MyListings', 'EditProfile', 'Favorites'];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'home-outline', label: 'My Listings', screen: 'MyListings' },
    { icon: 'heart-outline', label: 'Favorites', screen: 'Favorites' },
    { icon: 'chatbubble-outline', label: 'Inquiries', screen: 'Inquiries' },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Help' },
  ];

  const handleMenuPress = (item) => {
    if (AVAILABLE_SCREENS.includes(item.screen)) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert('Coming Soon 🚀', `${item.label} will be available in the next update!`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarArea}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{user?.full_name?.[0] || 'U'}</Text></View>
            )}
            <View>
              <Text style={FONTS.h3}>{user?.full_name || 'User'}</Text>
              <Text style={FONTS.caption}>{user?.email}</Text>
              {user?.role === 'lister' && <View style={styles.listerBadge}><Ionicons name="checkmark-shield" size={12} color={COLORS.primary} /><Text style={styles.listerText}>{user.lister_type || 'Lister'}</Text></View>}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{user?.listings_count || 0}</Text><Text style={FONTS.caption}>Listings</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{user?.favorites_count || 0}</Text><Text style={FONTS.caption}>Favorites</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>0</Text><Text style={FONTS.caption}>Reviews</Text></View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuIcon}><Ionicons name={item.icon} size={20} color={COLORS.primary} /></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  avatarArea: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontFamily: 'Raleway_800ExtraBold', color: '#FFF' },
  listerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  listerText: { fontSize: 11, fontFamily: 'Raleway_600SemiBold', color: COLORS.primary, textTransform: 'capitalize' },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, padding: 18, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text, marginBottom: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  menu: { marginHorizontal: 20, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'Raleway_500Medium', color: COLORS.text },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: SIZES.radius.lg, borderWidth: 1.5, borderColor: COLORS.errorLight },
  logoutText: { fontSize: 15, fontFamily: 'Raleway_600SemiBold', color: COLORS.error },
});
