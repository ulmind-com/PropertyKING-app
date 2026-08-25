import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme';
import { propertyAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';
import { DISTRESS_TYPES, distressColor } from '../../utils/distress';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const SORTS = [
  { value: 'created_at',                label: 'Newest' },
  { value: 'price',                     label: 'Lowest price' },
  { value: 'distress.estimated_equity', label: 'Biggest discount' },
  { value: 'distress.auction_date',     label: 'Auction soonest' },
];

const PER_PAGE = 20;

/**
 * Distressed listings browser — the app counterpart of the website's
 * /distressed page. Same filters, same sorts, same "claimable only" toggle.
 */
export default function DistressedScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [types, setTypes] = useState([]);
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [claimableOnly, setClaimableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');

  const buildParams = useCallback((pageNo) => {
    const params = {
      is_distressed: true,
      page: pageNo,
      limit: PER_PAGE,
      sort_by: sortBy,
      sort_order: (sortBy === 'price' || sortBy === 'distress.auction_date') ? 'asc' : 'desc',
    };
    if (types.length) params.distress_type = types.join(',');
    if (state) params.state = state;
    if (search) params.search = search;
    if (claimableOnly) params.claim_status = 'unclaimed';
    return params;
  }, [types, state, search, claimableOnly, sortBy]);

  const load = useCallback(async (pageNo = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await propertyAPI.list(buildParams(pageNo));
      const list = res.data.properties || [];
      setProperties(prev => (append ? [...prev, ...list] : list));
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 0);
      setPage(pageNo);
    } catch (e) {
      if (!append) setProperties([]);
    } finally {
      setLoading(false); setLoadingMore(false); setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => { load(1, false); }, [load]);

  const toggleType = (value) => {
    setTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const clearAll = () => {
    setTypes([]); setState(''); setSearch(''); setSearchInput('');
    setClaimableOnly(false); setSortBy('created_at');
  };

  const activeCount = types.length + (state ? 1 : 0) + (claimableOnly ? 1 : 0)
    + (sortBy !== 'created_at' ? 1 : 0);

  const loadMore = () => {
    if (!loadingMore && page < totalPages) load(page + 1, true);
  };

  const renderHeader = () => (
    <View>
      <View style={s.hero}>
        <View style={s.heroBadge}>
          <Ionicons name="hammer" size={13} color="#FFF" />
          <Text style={s.heroBadgeText}>DISTRESSED</Text>
        </View>
        <Text style={s.heroTitle}>Below-market opportunities</Text>
        <Text style={s.heroSub}>
          Foreclosures, auctions and bank-owned listings — {total.toLocaleString()} available
        </Text>
      </View>

      {/* Search + filter toggle */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={17} color={COLORS.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="City, address, ZIP…"
            placeholderTextColor={COLORS.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setSearch(searchInput.trim())}
            returnKeyType="search"
          />
          {searchInput ? (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }}>
              <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, activeCount > 0 && s.filterBtnActive]}
          onPress={() => setShowFilters(v => !v)}
          activeOpacity={0.85}>
          <Ionicons name="options-outline" size={18}
                    color={activeCount > 0 ? '#FFF' : COLORS.text} />
          {activeCount > 0 && <Text style={s.filterCount}>{activeCount}</Text>}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={s.filters}>
          <Text style={s.filterLabel}>Distress type</Text>
          <View style={s.chipWrap}>
            {DISTRESS_TYPES.map(t => {
              const on = types.includes(t.value);
              return (
                <TouchableOpacity key={t.value}
                  style={[s.chip, on && { backgroundColor: distressColor(t.value), borderColor: distressColor(t.value) }]}
                  onPress={() => toggleType(t.value)} activeOpacity={0.8}>
                  <Text style={[s.chipText, on && s.chipTextOn]}>{t.short}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.filterLabel}>Sort by</Text>
          <View style={s.chipWrap}>
            {SORTS.map(o => (
              <TouchableOpacity key={o.value}
                style={[s.chip, sortBy === o.value && s.chipOn]}
                onPress={() => setSortBy(o.value)} activeOpacity={0.8}>
                <Text style={[s.chipText, sortBy === o.value && s.chipTextOn]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.filterLabel}>State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <TouchableOpacity style={[s.chip, !state && s.chipOn]} onPress={() => setState('')}>
              <Text style={[s.chipText, !state && s.chipTextOn]}>All</Text>
            </TouchableOpacity>
            {US_STATES.map(st => (
              <TouchableOpacity key={st}
                style={[s.chip, state === st && s.chipOn]}
                onPress={() => setState(state === st ? '' : st)}>
                <Text style={[s.chipText, state === st && s.chipTextOn]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={s.claimRow} onPress={() => setClaimableOnly(v => !v)}
                            activeOpacity={0.8}>
            <Ionicons
              name={claimableOnly ? 'checkbox' : 'square-outline'}
              size={20} color={claimableOnly ? COLORS.primary : COLORS.textMuted} />
            <Text style={s.claimLabel}>Only show properties I can claim</Text>
          </TouchableOpacity>

          {activeCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll} activeOpacity={0.8}>
              <Ionicons name="close" size={14} color={COLORS.text} />
              <Text style={s.clearText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={s.resultCount}>
        {loading ? 'Loading…' : `${total.toLocaleString()} propert${total === 1 ? 'y' : 'ies'}`}
      </Text>
    </View>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={loading ? [] : properties}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            style={{ marginHorizontal: 20, marginBottom: 16 }}
            onPress={() => navigation.navigate('PropertyDetails', { property: item })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
          ) : (
            <View style={s.empty}>
              <Ionicons name="home-outline" size={40} color={COLORS.textMuted} />
              <Text style={s.emptyTitle}>No distressed listings match</Text>
              <Text style={s.emptySub}>Try clearing a filter or widening the state.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.primary} />
                      : <View style={{ height: 24 }} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing}
                          onRefresh={() => { setRefreshing(true); load(1, false); }} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  hero: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    backgroundColor: '#DC2626', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 6, marginBottom: 10,
  },
  heroBadgeText: { fontFamily: 'Raleway_800ExtraBold', fontSize: 9.5, color: '#FFF', letterSpacing: 0.8, marginLeft: 4 },
  heroTitle: { ...FONTS.h1, fontSize: 25 },
  heroSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: COLORS.textSecondary, marginTop: 5, lineHeight: 19 },

  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.bgAlt, borderRadius: 13, paddingHorizontal: 13,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1, paddingVertical: 11, marginLeft: 8,
    fontFamily: 'Raleway_500Medium', fontSize: 14, color: COLORS.text,
  },
  filterBtn: {
    width: 46, borderRadius: 13, backgroundColor: COLORS.bgAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterCount: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: '#FFF', marginLeft: 3 },

  filters: {
    marginHorizontal: 20, marginBottom: 14, padding: 14,
    backgroundColor: COLORS.bgAlt, borderRadius: 15,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterLabel: {
    fontFamily: 'Raleway_700Bold', fontSize: 11, color: COLORS.textMuted,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, marginTop: 6,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    marginRight: 7, marginBottom: 7,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: COLORS.textSecondary },
  chipTextOn: { color: '#FFF' },

  claimRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  claimLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 12.5, color: COLORS.text, marginLeft: 8 },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    marginTop: 14, paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 9, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  clearText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: COLORS.text, marginLeft: 5 },

  resultCount: {
    paddingHorizontal: 20, paddingBottom: 12,
    fontFamily: 'Raleway_600SemiBold', fontSize: 12.5, color: COLORS.textMuted,
  },

  empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 40 },
  emptyTitle: { ...FONTS.h4, marginTop: 12 },
  emptySub: {
    fontFamily: 'Raleway_400Regular', fontSize: 13, color: COLORS.textSecondary,
    marginTop: 5, textAlign: 'center',
  },
});
