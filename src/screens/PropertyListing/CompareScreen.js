import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useCompare } from '../../context/CompareContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.45;

export default function CompareScreen({ navigation }) {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  const formatPrice = (p, u) => {
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p || 0);
    return u === 'per_month' ? `${f}/mo` : u === 'per_night' ? `${f}/night` : f;
  };

  if (compareList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={FONTS.h3}>Compare</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContent}>
          <Ionicons name="git-compare-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Nothing to Compare</Text>
          <Text style={styles.emptySub}>Add properties to compare them side by side.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exploreBtnText}>Explore Properties</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Row mapping logic
  const attributeRows = [
    { label: 'Price', key: 'price', render: (p) => <Text style={styles.priceText}>{formatPrice(p.price, p.price_unit)}</Text> },
    { label: 'Type', key: 'type', render: (p) => <Text style={styles.attrText}>{p.property_type_name}</Text> },
    { label: 'Bedrooms', key: 'beds', render: (p) => <Text style={styles.attrText}>{p.details?.bedrooms || 0} Beds</Text> },
    { label: 'Bathrooms', key: 'baths', render: (p) => <Text style={styles.attrText}>{p.details?.bathrooms || 0} Baths</Text> },
    { label: 'Square Ft', key: 'sqft', render: (p) => <Text style={styles.attrText}>{p.details?.total_sqft ? `${p.details.total_sqft.toLocaleString()} sqft` : '-'}</Text> },
    { label: 'Year Built', key: 'year', render: (p) => <Text style={styles.attrText}>{p.details?.year_built || '-'}</Text> },
    { label: 'Garage', key: 'garage', render: (p) => <Text style={styles.attrText}>{p.details?.garage_spaces || 0} Spaces</Text> },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={FONTS.h3}>Compare ({compareList.length})</Text>
        <TouchableOpacity onPress={clearCompare} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {compareList.map((property, idx) => {
            const imgUrl = property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400';
            
            return (
              <View key={property.id} style={styles.column}>
                {/* Header Card */}
                <View style={styles.propertyCard}>
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => removeFromCompare(property.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('PropertyDetails', { property })}>
                    <Image source={{ uri: imgUrl }} style={styles.cardImage} />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{property.title}</Text>
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {property.location?.city}, {property.location?.state}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Attributes */}
                <View style={styles.attributesList}>
                  {attributeRows.map((row) => (
                    <View key={row.key} style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>{row.label}</Text>
                      {row.render(property)}
                    </View>
                  ))}
                  
                  {/* Amenities */}
                  <View style={styles.amenitiesSection}>
                    <Text style={styles.attributeLabel}>Amenities</Text>
                    {property.amenities?.slice(0, 5).map((amenity, i) => (
                      <View key={i} style={styles.amenityChip}>
                        <Ionicons name="checkmark" size={14} color={COLORS.primary} />
                        <Text style={styles.amenityText}>{amenity.name}</Text>
                      </View>
                    ))}
                    {(!property.amenities || property.amenities.length === 0) && (
                      <Text style={styles.attrText}>None listed</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  emptyContainer: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 56, 
    paddingBottom: 16, 
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { padding: 8 },
  clearBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  emptySub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  exploreBtn: { marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  exploreBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  scrollContent: { padding: 16, gap: 16 },
  column: { width: ITEM_WIDTH },
  
  propertyCard: { 
    backgroundColor: COLORS.bg, 
    borderRadius: 20, 
    ...SHADOWS.md, 
    overflow: 'hidden',
    marginBottom: 20
  },
  cardImage: { width: '100%', height: 140, backgroundColor: COLORS.borderLight },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 20, marginBottom: 4 },
  cardLocation: { fontSize: 12, color: COLORS.textSecondary },
  removeBtn: { position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: '#FFF', borderRadius: 12 },

  attributesList: { gap: 12 },
  attributeRow: { 
    backgroundColor: COLORS.bg, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.sm
  },
  attributeLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  attrText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  
  amenitiesSection: {
    backgroundColor: COLORS.bg, 
    padding: 16, 
    borderRadius: 16, 
    gap: 8,
    ...SHADOWS.sm,
    marginTop: 8
  },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  amenityText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary }
});
