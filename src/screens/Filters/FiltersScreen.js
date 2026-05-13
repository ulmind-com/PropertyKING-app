import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Animated, Keyboard } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { propertyTypeAPI, amenityAPI } from '../../api';

const SORT_OPTIONS = [
  { key: 'created_at_desc', label: 'Newest First', icon: 'time-outline', sort_by: 'created_at', sort_order: 'desc' },
  { key: 'price_asc', label: 'Price: Low → High', icon: 'trending-up-outline', sort_by: 'price', sort_order: 'asc' },
  { key: 'price_desc', label: 'Price: High → Low', icon: 'trending-down-outline', sort_by: 'price', sort_order: 'desc' },
  { key: 'views_desc', label: 'Most Viewed', icon: 'eye-outline', sort_by: 'views_count', sort_order: 'desc' },
  { key: 'sqft_desc', label: 'Largest First', icon: 'resize-outline', sort_by: 'details.total_sqft', sort_order: 'desc' },
];

const TYPE_ICONS = {
  'House': 'home', 'Condo': 'office-building', 'Townhouse': 'home-group',
  'Apartment': 'domain', 'Villa': 'home-variant', 'Land': 'terrain',
  'Commercial': 'store', 'Multi-Family': 'home-city',
};

export default function FiltersScreen({ navigation, route }) {
  const [types, setTypes] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedType, setSelectedType] = useState(route.params?.property_type_id || null);
  const [listingType, setListingType] = useState(route.params?.listing_type || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState(null);
  const [bathrooms, setBathrooms] = useState(null);
  const [minSqft, setMinSqft] = useState('');
  const [maxSqft, setMaxSqft] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [sortOption, setSortOption] = useState('created_at_desc');
  const [selectedAmenities, setSelectedAmenities] = useState({});
  const [showSortPicker, setShowSortPicker] = useState(false);

  useEffect(() => {
    loadTypes();
    loadAmenities();
  }, []);

  const loadTypes = async () => {
    try { const r = await propertyTypeAPI.list(); setTypes(r.data || []); } catch(e) {}
  };

  const loadAmenities = async () => {
    try { const r = await amenityAPI.list(); setAmenitiesList(r.data || []); } catch(e) {}
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedType) count++;
    if (listingType) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (bedrooms) count++;
    if (bathrooms) count++;
    if (minSqft || maxSqft) count++;
    if (city) count++;
    if (state) count++;
    if (sortOption !== 'created_at_desc') count++;
    count += Object.values(selectedAmenities).filter(Boolean).length;
    return count;
  };

  const clearAll = () => {
    setSelectedType(null); setListingType('');
    setMinPrice(''); setMaxPrice('');
    setBedrooms(null); setBathrooms(null);
    setMinSqft(''); setMaxSqft('');
    setCity(''); setState('');
    setSortOption('created_at_desc');
    setSelectedAmenities({});
  };

  const applyFilters = () => {
    Keyboard.dismiss();
    const sort = SORT_OPTIONS.find(s => s.key === sortOption) || SORT_OPTIONS[0];
    const params = {
      property_type_id: selectedType || undefined,
      listing_type: listingType || undefined,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms_min: bedrooms && bedrooms !== 'Any' ? bedrooms : undefined,
      bathrooms_min: bathrooms && bathrooms !== 'Any' ? bathrooms : undefined,
      min_sqft: minSqft ? parseInt(minSqft) : undefined,
      max_sqft: maxSqft ? parseInt(maxSqft) : undefined,
      city: city || undefined,
      state: state || undefined,
      sort_by: sort.sort_by,
      sort_order: sort.sort_order,
    };
    // Remove undefined keys
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    navigation.navigate('PropertyListing', params);
  };

  const filterCount = getActiveFilterCount();
  const currentSort = SORT_OPTIONS.find(s => s.key === sortOption) || SORT_OPTIONS[0];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
          <Text style={s.clearText}>Reset</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Filters</Text>
          {filterCount > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{filterCount}</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── Sort By ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sort By</Text>
          <TouchableOpacity style={s.sortSelector} onPress={() => setShowSortPicker(!showSortPicker)}>
            <Ionicons name={currentSort.icon} size={18} color={COLORS.primary} />
            <Text style={s.sortSelectorText}>{currentSort.label}</Text>
            <Ionicons name={showSortPicker ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          {showSortPicker && (
            <View style={s.sortDropdown}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.sortOption, sortOption === opt.key && s.sortOptionActive]}
                  onPress={() => { setSortOption(opt.key); setShowSortPicker(false); }}
                >
                  <Ionicons name={opt.icon} size={16} color={sortOption === opt.key ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[s.sortOptionText, sortOption === opt.key && s.sortOptionTextActive]}>{opt.label}</Text>
                  {sortOption === opt.key && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Listing Type ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Listing Type</Text>
          <View style={s.chipRow}>
            {[
              { k: '', l: 'All', icon: 'apps-outline' },
              { k: 'sale', l: 'Buy', icon: 'cart-outline' },
              { k: 'rent', l: 'Rent', icon: 'key-outline' },
              { k: 'lease', l: 'Lease', icon: 'document-text-outline' },
            ].map(t => (
              <TouchableOpacity key={t.k} style={[s.chip, listingType === t.k && s.chipActive]} onPress={() => setListingType(t.k)}>
                <Ionicons name={t.icon} size={16} color={listingType === t.k ? '#FFF' : COLORS.textSecondary} />
                <Text style={[s.chipText, listingType === t.k && s.chipTextActive]}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Property Type ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Property Type</Text>
          <View style={s.typeGrid}>
            {types.slice(0, 8).map(t => {
              const sel = selectedType === t.id;
              return (
                <TouchableOpacity key={t.id} style={[s.typeCard, sel && s.typeCardActive]} onPress={() => setSelectedType(sel ? null : t.id)}>
                  <MaterialCommunityIcons name={TYPE_ICONS[t.name] || 'home'} size={24} color={sel ? '#FFF' : COLORS.primary} />
                  <Text style={[s.typeCardText, sel && s.typeCardTextActive]}>{t.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Price Range ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Price Range</Text>
          <View style={s.rangeRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputPrefix}>$</Text>
              <TextInput
                style={s.rangeInput}
                placeholder="Min"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={s.rangeDash}><Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>—</Text></View>
            <View style={s.inputWrap}>
              <Text style={s.inputPrefix}>$</Text>
              <TextInput
                style={s.rangeInput}
                placeholder="Max"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>
          {/* Quick price chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
            {[
              { label: 'Under $100K', min: '', max: '100000' },
              { label: '$100K–$500K', min: '100000', max: '500000' },
              { label: '$500K–$1M', min: '500000', max: '1000000' },
              { label: '$1M–$5M', min: '1000000', max: '5000000' },
              { label: '$5M+', min: '5000000', max: '' },
            ].map(q => {
              const isActive = minPrice === q.min && maxPrice === q.max;
              return (
                <TouchableOpacity key={q.label} style={[s.quickChip, isActive && s.quickChipActive]}
                  onPress={() => { setMinPrice(isActive ? '' : q.min); setMaxPrice(isActive ? '' : q.max); }}>
                  <Text style={[s.quickChipText, isActive && s.quickChipTextActive]}>{q.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Bedrooms ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bedrooms</Text>
          <View style={s.chipRow}>
            {['Any', 1, 2, 3, 4, 5].map(n => {
              const sel = n === 'Any' ? bedrooms === 'Any' : bedrooms === n;
              return (
                <TouchableOpacity key={n} style={[s.numChip, sel && s.numChipActive]} onPress={() => setBedrooms(sel ? null : n)}>
                  {n === 'Any' ? (
                    <Text style={[s.numChipText, sel && s.numChipTextActive]}>Any</Text>
                  ) : (
                    <>
                      <Text style={[s.numChipNum, sel && s.numChipTextActive]}>{n}</Text>
                      <Ionicons name="bed-outline" size={14} color={sel ? '#FFF' : COLORS.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Bathrooms ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bathrooms</Text>
          <View style={s.chipRow}>
            {['Any', 1, 2, 3, 4, 5].map(n => {
              const sel = n === 'Any' ? bathrooms === 'Any' : bathrooms === n;
              return (
                <TouchableOpacity key={n} style={[s.numChip, sel && s.numChipActive]} onPress={() => setBathrooms(sel ? null : n)}>
                  {n === 'Any' ? (
                    <Text style={[s.numChipText, sel && s.numChipTextActive]}>Any</Text>
                  ) : (
                    <>
                      <Text style={[s.numChipNum, sel && s.numChipTextActive]}>{n}</Text>
                      <MaterialCommunityIcons name="shower" size={14} color={sel ? '#FFF' : COLORS.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Area / Sqft ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Area (sqft)</Text>
          <View style={s.rangeRow}>
            <View style={s.inputWrap}>
              <Ionicons name="resize-outline" size={16} color={COLORS.textMuted} />
              <TextInput style={s.rangeInput} placeholder="Min sqft" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={minSqft} onChangeText={setMinSqft} />
            </View>
            <View style={s.rangeDash}><Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>—</Text></View>
            <View style={s.inputWrap}>
              <Ionicons name="resize-outline" size={16} color={COLORS.textMuted} />
              <TextInput style={s.rangeInput} placeholder="Max sqft" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={maxSqft} onChangeText={setMaxSqft} />
            </View>
          </View>
        </View>

        {/* ── Location ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Location</Text>
          <View style={s.rangeRow}>
            <View style={[s.inputWrap, { flex: 2 }]}>  
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <TextInput style={s.rangeInput} placeholder="City" placeholderTextColor={COLORS.textMuted} value={city} onChangeText={setCity} autoCapitalize="words" />
            </View>
            <View style={[s.inputWrap, { flex: 1 }]}>  
              <TextInput style={[s.rangeInput, { textAlign: 'center' }]} placeholder="State" placeholderTextColor={COLORS.textMuted} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" />
            </View>
          </View>
        </View>

        {/* ── Amenities ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Amenities</Text>
          <View style={s.amenityGrid}>
            {(amenitiesList.length > 0 ? amenitiesList : [
              { id: 'ac', name: 'Central AC' }, { id: 'pool', name: 'Pool' },
              { id: 'garage', name: 'Garage' }, { id: 'hardwood', name: 'Hardwood Floors' },
              { id: 'fireplace', name: 'Fireplace' }, { id: 'laundry', name: 'In-unit Laundry' },
              { id: 'gym', name: 'Gym' }, { id: 'doorman', name: 'Doorman' },
            ]).map(a => {
              const sel = selectedAmenities[a.id || a.name];
              return (
                <TouchableOpacity
                  key={a.id || a.name}
                  style={[s.amenityChip, sel && s.amenityChipActive]}
                  onPress={() => setSelectedAmenities(prev => ({ ...prev, [a.id || a.name]: !prev[a.id || a.name] }))}
                >
                  <Ionicons name={sel ? "checkmark-circle" : "add-circle-outline"} size={16} color={sel ? '#FFF' : COLORS.primary} />
                  <Text style={[s.amenityChipText, sel && s.amenityChipTextActive]}>{a.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.resetBtn} onPress={clearAll}>
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
          <Text style={s.resetText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
          <Ionicons name="search" size={18} color="#FFF" />
          <Text style={s.applyText}>Show Results</Text>
          {filterCount > 0 && <View style={s.applyBadge}><Text style={s.applyBadgeText}>{filterCount}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  badge: { backgroundColor: COLORS.primary, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bgAlt, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, paddingBottom: 20 },

  // Section
  section: { marginBottom: 26 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12, letterSpacing: -0.2 },

  // Sort
  sortSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  sortSelectorText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  sortDropdown: { marginTop: 8, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  sortOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sortOptionActive: { backgroundColor: COLORS.primarySoft },
  sortOptionText: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: '600' },

  // Chips
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 11, borderRadius: SIZES.radius.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#FFF' },

  // Property Type Grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '22.5%', aspectRatio: 0.9, borderRadius: SIZES.radius.lg, borderWidth: 1.5, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.bgAlt },
  typeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.sm },
  typeCardText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },
  typeCardTextActive: { color: '#FFF' },

  // Range inputs
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: 14, height: 48 },
  inputPrefix: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  rangeInput: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  rangeDash: { width: 24, alignItems: 'center' },

  // Quick price chips
  quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  quickChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  quickChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  quickChipTextActive: { color: COLORS.primary },

  // Number chips
  numChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: SIZES.radius.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  numChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  numChipNum: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  numChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  numChipTextActive: { color: '#FFF' },

  // Amenities
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  amenityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  amenityChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  amenityChipTextActive: { color: '#FFF' },

  // Bottom bar
  bottomBar: { flexDirection: 'row', padding: 16, paddingBottom: 34, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.bg },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20, height: 52, borderRadius: SIZES.radius.lg, borderWidth: 1.5, borderColor: COLORS.border },
  resetText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  applyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: SIZES.radius.lg, backgroundColor: COLORS.primary, ...SHADOWS.primary },
  applyText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  applyBadge: { backgroundColor: '#FFF', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  applyBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
});
