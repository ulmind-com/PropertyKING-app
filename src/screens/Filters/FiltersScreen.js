import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { propertyTypeAPI } from '../../api';

export default function FiltersScreen({ navigation, route }) {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(route.params?.property_type_id || null);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [bedrooms, setBedrooms] = useState(null);
  const [bathrooms, setBathrooms] = useState(null);
  const [listingType, setListingType] = useState('');
  const [amenities, setAmenities] = useState({});

  useEffect(() => { loadTypes(); }, []);
  const loadTypes = async () => { try { const r = await propertyTypeAPI.list(); setTypes(r.data || []); } catch(e) {} };

  const typeIcons = { 'House': 'home', 'Condo': 'office-building', 'Townhouse': 'home-group', 'Apartment': 'domain', 'Villa': 'home-variant', 'Land': 'terrain', 'Commercial': 'store', 'Multi-Family': 'home-city' };

  const applyFilters = () => {
    navigation.navigate('PropertyListing', {
      property_type_id: selectedType, bedrooms_min: bedrooms, bathrooms_min: bathrooms,
      listing_type: listingType, min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
      max_price: priceRange[1] < 5000000 ? priceRange[1] : undefined,
    });
  };

  const clearAll = () => { setSelectedType(null); setBedrooms(null); setBathrooms(null); setListingType(''); setPriceRange([0, 5000000]); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={clearAll}><Ionicons name="refresh-outline" size={22} color={COLORS.textMuted} /></TouchableOpacity>
        <Text style={FONTS.h3}>Filter</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Listing Type */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Listing Type</Text>
          <View style={styles.chipRow}>
            {[{ k: '', l: 'All' }, { k: 'sale', l: 'Buy' }, { k: 'rent', l: 'Rent' }, { k: 'lease', l: 'Lease' }].map(t => (
              <TouchableOpacity key={t.k} style={[styles.chip, listingType === t.k && styles.chipActive]} onPress={() => setListingType(t.k)}>
                <Text style={[styles.chipText, listingType === t.k && styles.chipTextActive]}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Property type</Text>
          <View style={styles.typeGrid}>
            {types.slice(0, 8).map(t => {
              const sel = selectedType === t.id;
              return (
                <TouchableOpacity key={t.id} style={[styles.typeCard, sel && styles.typeCardActive]} onPress={() => setSelectedType(sel ? null : t.id)}>
                  <MaterialCommunityIcons name={typeIcons[t.name] || 'home'} size={26} color={sel ? COLORS.textInverse : COLORS.textSecondary} />
                  <Text style={[styles.typeCardText, sel && styles.typeCardTextActive]}>{t.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Price range</Text>
          <View style={styles.priceBarContainer}>
            <View style={styles.priceBar}>
              {Array(20).fill(0).map((_, i) => (
                <View key={i} style={[styles.priceBarItem, { height: 10 + Math.random() * 30, backgroundColor: i >= 4 && i <= 14 ? COLORS.primary : COLORS.border }]} />
              ))}
            </View>
            <View style={styles.priceLabels}>
              <Text style={FONTS.bodyBold}>${priceRange[0].toLocaleString()}</Text>
              <Text style={FONTS.bodyBold}>${priceRange[1].toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Bedrooms */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Bedrooms</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5, 'Any'].map(n => (
              <TouchableOpacity key={n} style={[styles.numChip, bedrooms === n && styles.numChipActive]} onPress={() => setBedrooms(bedrooms === n ? null : n)}>
                <Text style={[styles.numChipText, bedrooms === n && styles.numChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bathrooms */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Bathrooms</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5, 'Any'].map(n => (
              <TouchableOpacity key={n} style={[styles.numChip, bathrooms === n && styles.numChipActive]} onPress={() => setBathrooms(bathrooms === n ? null : n)}>
                <Text style={[styles.numChipText, bathrooms === n && styles.numChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={FONTS.h4}>Amenities</Text>
          {['Central AC', 'Pool', 'Garage', 'Hardwood Floors', 'Fireplace', 'In-unit Laundry'].map(a => (
            <TouchableOpacity key={a} style={styles.amenityRow} onPress={() => setAmenities(prev => ({ ...prev, [a]: !prev[a] }))}>
              <Text style={FONTS.body}>{a}</Text>
              <View style={[styles.toggle, amenities[a] && styles.toggleActive]}>
                <View style={[styles.toggleDot, amenities[a] && styles.toggleDotActive]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
          <Text style={styles.applyText}>Save Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  scrollContent: { padding: 20, paddingBottom: 100 },

  section: { marginBottom: 28 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radius.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.textInverse },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  typeCard: { width: '22.5%', aspectRatio: 1, borderRadius: SIZES.radius.lg, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.bg },
  typeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeCardText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  typeCardTextActive: { color: COLORS.textInverse },

  priceBarContainer: { marginTop: 12 },
  priceBar: { flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 3 },
  priceBarItem: { flex: 1, borderRadius: 2 },
  priceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },

  numChip: { width: 48, height: 48, borderRadius: SIZES.radius.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  numChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  numChipText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  numChipTextActive: { color: COLORS.textInverse },

  amenityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', padding: 3 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  toggleDotActive: { alignSelf: 'flex-end' },

  bottomBar: { padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  applyBtn: { backgroundColor: COLORS.primary, height: 54, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.primary },
  applyText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
