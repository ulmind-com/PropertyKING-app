import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;

export default function PropertyCard({ property, onPress, style, variant = 'featured' }) {
  const [liked, setLiked] = useState(property?.is_favorited || false);

  const primaryImage = property?.images?.find(i => i.is_primary)?.url
    || property?.images?.[0]?.url
    || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600';

  const formatPrice = (price, unit) => {
    if (!price) return '$0';
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
    if (unit === 'per_month') return `${formatted}/mo`;
    return formatted;
  };

  if (variant === 'list') {
    return (
      <TouchableOpacity style={[styles.listCard, style]} onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: primaryImage }} style={styles.listImage} />
        <View style={styles.listInfo}>
          <Text style={FONTS.bodyBold} numberOfLines={2}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={FONTS.caption} numberOfLines={1}>{property.location?.city}, {property.location?.state}</Text>
          </View>
          <View style={styles.statsRow}>
            {property.details?.bedrooms > 0 && <View style={styles.stat}><Ionicons name="bed-outline" size={13} color={COLORS.primary} /><Text style={styles.statText}>{property.details.bedrooms}</Text></View>}
            {property.details?.bathrooms > 0 && <View style={styles.stat}><Ionicons name="water-outline" size={13} color={COLORS.primary} /><Text style={styles.statText}>{property.details.bathrooms}</Text></View>}
          </View>
          <Text style={[FONTS.priceSmall, { color: COLORS.primary, marginTop: 4 }]}>{formatPrice(property.price, property.price_unit)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: primaryImage }} style={styles.image} />

        {/* Gradient Overlay */}
        <View style={styles.imageOverlay} />

        {/* Badge */}
        <View style={[styles.badge, property.listing_type === 'sale' ? styles.badgeSale : styles.badgeRent]}>
          <Text style={styles.badgeText}>{property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}</Text>
        </View>

        {/* Favorite */}
        <TouchableOpacity style={styles.favBtn} onPress={() => setLiked(!liked)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? COLORS.error : '#FFF'} />
        </TouchableOpacity>

        {/* Rating */}
        {property.average_rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={COLORS.accent} />
            <Text style={styles.ratingText}>{property.average_rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[FONTS.h4, { marginBottom: 4 }]} numberOfLines={2}>{property.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={FONTS.caption} numberOfLines={1}>
            {property.location?.city}, {property.location?.state}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.statsRow}>
            {property.details?.bedrooms > 0 && (
              <View style={styles.stat}>
                <Ionicons name="bed-outline" size={15} color={COLORS.primary} />
                <Text style={styles.statText}>{property.details.bedrooms}</Text>
              </View>
            )}
            {property.details?.bathrooms > 0 && (
              <View style={styles.stat}>
                <Ionicons name="water-outline" size={15} color={COLORS.primary} />
                <Text style={styles.statText}>{property.details.bathrooms}</Text>
              </View>
            )}
            {property.details?.total_sqft > 0 && (
              <View style={styles.stat}>
                <Ionicons name="resize-outline" size={15} color={COLORS.primary} />
                <Text style={styles.statText}>{(property.details.total_sqft / 1000).toFixed(1)}k</Text>
              </View>
            )}
          </View>
          <Text style={[FONTS.priceSmall, { color: COLORS.primary }]}>
            {formatPrice(property.price, property.price_unit)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, backgroundColor: COLORS.card, borderRadius: SIZES.radius.xl, overflow: 'hidden', ...SHADOWS.md },
  imageWrapper: { height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'transparent' },

  badge: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 12, paddingVertical: 5, borderRadius: SIZES.radius.full },
  badgeSale: { backgroundColor: COLORS.primary },
  badgeRent: { backgroundColor: COLORS.success },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  favBtn: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },

  ratingBadge: { position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radius.full, backgroundColor: 'rgba(255,255,255,0.92)' },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.text },

  info: { padding: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // List variant
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, overflow: 'hidden', marginBottom: 12, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  listImage: { width: 120, height: 120 },
  listInfo: { flex: 1, padding: 12, justifyContent: 'center' },
});
