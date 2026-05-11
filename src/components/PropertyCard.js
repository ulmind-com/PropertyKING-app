import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../theme';

const { width } = Dimensions.get('window');

export default function PropertyCard({ property, onPress, style }) {
  const [liked, setLiked] = useState(property?.is_favorited || false);

  const primaryImage = property?.images?.find(i => i.is_primary)?.url
    || property?.images?.[0]?.url
    || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600';

  const formatPrice = (price, unit) => {
    if (!price) return '$0';
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
    if (unit === 'per_month') return `${f}/mo`;
    return f;
  };

  const d = property?.details || {};
  const loc = property?.location || {};

  return (
    <TouchableOpacity style={[s.card, style]} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={s.imgWrap}>
        <Image source={{ uri: primaryImage }} style={s.img} />

        {/* Sale/Rent Badge */}
        <View style={[s.badge, property?.listing_type === 'rent' ? s.badgeRent : s.badgeSale]}>
          <Text style={s.badgeText}>{property?.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT'}</Text>
        </View>

        {/* Heart */}
        <TouchableOpacity style={s.heartBtn} onPress={() => setLiked(!liked)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#EF4444' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{property?.title}</Text>

        <View style={s.locRow}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={s.locText} numberOfLines={1}>{loc.city}{loc.state ? `, ${loc.state}` : ''}</Text>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {d.bedrooms > 0 && (
            <View style={s.statItem}>
              <Ionicons name="bed-outline" size={14} color={COLORS.textMuted} />
              <Text style={s.statText}>{d.bedrooms} Bed</Text>
            </View>
          )}
          {d.bathrooms > 0 && (
            <View style={s.statItem}>
              <Ionicons name="water-outline" size={14} color={COLORS.textMuted} />
              <Text style={s.statText}>{d.bathrooms} Bath</Text>
            </View>
          )}
          {d.total_sqft > 0 && (
            <View style={s.statItem}>
              <Ionicons name="resize-outline" size={14} color={COLORS.textMuted} />
              <Text style={s.statText}>{d.total_sqft.toLocaleString()} sqft</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <Text style={s.price}>{formatPrice(property?.price, property?.price_unit)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 200, backgroundColor: COLORS.bgDark },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeSale: { backgroundColor: COLORS.primary },
  badgeRent: { backgroundColor: COLORS.success },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heartBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },

  info: { padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  price: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
});
