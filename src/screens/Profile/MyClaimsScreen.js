import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '../../theme';
import { claimAPI, editRequestAPI, propertyAPI } from '../../api';
import { statusStyle, timeAgo } from '../../utils/distress';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300';

/**
 * Claims and edit requests the user has submitted, mirroring the website's
 * My Claims page. Both queues are admin-reviewed, so the status pill and the
 * rejection reason are the whole point of the screen.
 */
export default function MyClaimsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('claims');
  const [claims, setClaims] = useState([]);
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.allSettled([
        claimAPI.mine({ limit: 50 }),
        editRequestAPI.mine({ limit: 50 }),
      ]);
      if (c.status === 'fulfilled') setClaims(c.value.data.claims || []);
      if (e.status === 'fulfilled') setEdits(e.value.data.edit_requests || []);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const openProperty = async (item) => {
    if (!item.property_slug && !item.property_id) return;
    try {
      const res = await propertyAPI.getBySlug(item.property_slug || item.property_id);
      navigation.navigate('PropertyDetails', { property: res.data });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open that property' });
    }
  };

  const withdraw = (item, kind) => {
    Alert.alert(
      kind === 'claim' ? 'Withdraw claim?' : 'Withdraw edit request?',
      'This cannot be undone, but you can submit again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw', style: 'destructive',
          onPress: async () => {
            try {
              if (kind === 'claim') await claimAPI.cancel(item.id);
              else await editRequestAPI.cancel(item.id);
              Toast.show({ type: 'success', text1: 'Withdrawn' });
              load();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: err.response?.data?.detail || 'Could not withdraw',
              });
            }
          },
        },
      ],
    );
  };

  const renderRow = (item, kind) => {
    const st = statusStyle(item.status);
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => openProperty(item)}>
        <Image source={{ uri: item.property_image || PLACEHOLDER }} style={s.thumb} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.title} numberOfLines={2}>{item.property_title || 'Property'}</Text>
          {item.property_address ? (
            <Text style={s.addr} numberOfLines={1}>{item.property_address}</Text>
          ) : null}

          <View style={s.metaRow}>
            <View style={[s.pill, { backgroundColor: st.bg }]}>
              <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
            </View>
            <Text style={s.time}>{timeAgo(item.created_at)}</Text>
          </View>

          {kind === 'edit' && item.diff?.length > 0 && (
            <Text style={s.diffLine} numberOfLines={2}>
              {item.diff.length} field{item.diff.length === 1 ? '' : 's'}:{' '}
              {item.diff.map(d => d.label).join(', ')}
            </Text>
          )}

          {item.status === 'rejected' && item.rejection_reason ? (
            <View style={s.reason}>
              <Ionicons name="alert-circle-outline" size={13} color="#991B1B" />
              <Text style={s.reasonText}>{item.rejection_reason}</Text>
            </View>
          ) : null}

          {item.status === 'pending' && (
            <TouchableOpacity
              style={s.withdrawBtn}
              onPress={() => withdraw(item, kind)}
              activeOpacity={0.8}>
              <Text style={s.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const data = tab === 'claims' ? claims : edits;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Claims</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.tabs}>
        {[
          { key: 'claims', label: `Claims (${claims.length})` },
          { key: 'edits',  label: `Edit requests (${edits.length})` },
        ].map(t => (
          <TouchableOpacity key={t.key}
            style={[s.tab, tab === t.key && s.tabOn]}
            onPress={() => setTab(t.key)} activeOpacity={0.85}>
            <Text style={[s.tabText, tab === t.key && s.tabTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderRow(item, tab === 'claims' ? 'claim' : 'edit')}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons
                name={tab === 'claims' ? 'shield-outline' : 'create-outline'}
                size={40} color={COLORS.textMuted} />
              <Text style={s.emptyTitle}>
                {tab === 'claims' ? 'No claims yet' : 'No edit requests yet'}
              </Text>
              <Text style={s.emptySub}>
                {tab === 'claims'
                  ? 'Find a listing you own and tap “Claim” on its page.'
                  : 'Edits to a property you own appear here while an admin reviews them.'}
              </Text>
              {tab === 'claims' && (
                <TouchableOpacity
                  style={s.browseBtn}
                  onPress={() => navigation.navigate('Distressed')}
                  activeOpacity={0.85}>
                  <Text style={s.browseText}>Browse distressed listings</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(); }} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bgAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...FONTS.h3 },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 6 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11,
    backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.border,
    marginRight: 8,
  },
  tabOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12.5, color: COLORS.textSecondary },
  tabTextOn: { color: '#FFF' },

  card: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 15,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  thumb: { width: 82, height: 82, borderRadius: 11, backgroundColor: COLORS.bgDark },
  title: { fontFamily: 'Raleway_700Bold', fontSize: 13.5, color: COLORS.text, lineHeight: 18 },
  addr: { fontFamily: 'Raleway_400Regular', fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 6 },
  pillText: { fontFamily: 'Raleway_700Bold', fontSize: 10 },
  time: { fontFamily: 'Raleway_500Medium', fontSize: 11, color: COLORS.textMuted, marginLeft: 8 },

  diffLine: {
    fontFamily: 'Raleway_500Medium', fontSize: 11.5, color: COLORS.textSecondary,
    marginTop: 6, lineHeight: 16,
  },
  reason: {
    flexDirection: 'row', gap: 5, marginTop: 7,
    backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8,
  },
  reasonText: { fontFamily: 'Raleway_500Medium', fontSize: 11.5, color: '#991B1B', flex: 1, marginLeft: 5 },

  withdrawBtn: {
    alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgAlt,
  },
  withdrawText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11.5, color: COLORS.textSecondary },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 36 },
  emptyTitle: { ...FONTS.h4, marginTop: 12 },
  emptySub: {
    fontFamily: 'Raleway_400Regular', fontSize: 13, color: COLORS.textSecondary,
    marginTop: 6, textAlign: 'center', lineHeight: 19,
  },
  browseBtn: {
    marginTop: 18, backgroundColor: COLORS.primary,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  browseText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: '#FFF' },
});
