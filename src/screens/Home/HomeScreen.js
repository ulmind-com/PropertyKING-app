import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, FlatList, Dimensions, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [location, setLocation] = useState('New York, NY');
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [typesRes, propsRes] = await Promise.allSettled([
        propertyTypeAPI.list(),
        propertyAPI.recommendations({ limit: 10 })
      ]);
      if (typesRes.status === 'fulfilled') setPropertyTypes(typesRes.value.data || []);
      if (propsRes.status === 'fulfilled') setProperties(propsRes.value.data?.properties || []);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleSearch = () => {
    if (searchText.trim()) navigation.navigate('PropertyListing', { search: searchText });
  };

  const typeIcons = {
    'House': 'home', 'Condo': 'office-building', 'Townhouse': 'home-group',
    'Apartment': 'domain', 'Villa': 'home-variant', 'Land': 'terrain',
    'Commercial': 'store', 'Multi-Family': 'home-city', 'Mobile Home': 'truck',
    'Farm/Ranch': 'barn',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.locationText}>{location}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apart, hotel, etc..."
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate('Filters')}>
            <Ionicons name="options-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Property Type Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={styles.typeScrollContent}>
          {propertyTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeChip, isSelected && styles.typeChipActive]}
                onPress={() => {
                  setSelectedType(isSelected ? null : type.id);
                  navigation.navigate('PropertyListing', { property_type_id: type.id, typeName: type.name });
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={typeIcons[type.name] || 'home'}
                  size={18}
                  color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                />
                <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Section */}
        <View style={styles.sectionHeader}>
          <Text style={FONTS.h3}>Featured</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PropertyListing')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : properties.length > 0 ? (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <PropertyCard
                property={item}
                onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item })}
                style={{ marginLeft: index === 0 ? 20 : 0 }}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            snapToInterval={width * 0.78 + 16}
            decelerationRate="fast"
          />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="home-outline" size={48} color={COLORS.border} />
            <Text style={[FONTS.body, { marginTop: 12 }]}>No properties yet</Text>
            <Text style={FONTS.caption}>Properties will appear here once listed</Text>
          </View>
        )}

        {/* Nearby Section */}
        <View style={styles.sectionHeader}>
          <Text style={FONTS.h3}>Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PropertyListing', { nearby: true })}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {properties.length > 0 ? (
          properties.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id + '_near'}
              style={styles.nearbyCard}
              onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item })}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }}
                style={styles.nearbyImage}
              />
              <View style={styles.nearbyInfo}>
                <Text style={[FONTS.bodyBold, { marginBottom: 4 }]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.nearbyLocation}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                  <Text style={FONTS.caption} numberOfLines={1}>{item.location?.city}, {item.location?.state}</Text>
                </View>
                <View style={styles.nearbyStats}>
                  {item.details?.bedrooms > 0 && <View style={styles.nearbyStatItem}><Ionicons name="bed-outline" size={14} color={COLORS.primary} /><Text style={styles.nearbyStatText}>{item.details.bedrooms}</Text></View>}
                  {item.details?.bathrooms > 0 && <View style={styles.nearbyStatItem}><Ionicons name="water-outline" size={14} color={COLORS.primary} /><Text style={styles.nearbyStatText}>{item.details.bathrooms}</Text></View>}
                  {item.details?.total_sqft > 0 && <View style={styles.nearbyStatItem}><Ionicons name="resize-outline" size={14} color={COLORS.primary} /><Text style={styles.nearbyStatText}>{item.details.total_sqft.toLocaleString()}</Text></View>}
                </View>
                <Text style={[FONTS.priceSmall, { color: COLORS.primary, marginTop: 6 }]}>
                  ${item.price?.toLocaleString()}{item.price_unit === 'per_month' ? '/mo' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : null}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  menuBtn: { width: 44, height: 44, justifyContent: 'center' },
  locationBtn: { alignItems: 'center' },
  locationLabel: { ...FONTS.caption, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { ...FONTS.bodyBold, fontSize: 15 },
  notifBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },

  searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 8, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: COLORS.borderLight, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterBtn: { width: 52, height: 52, borderRadius: SIZES.radius.lg, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  typeScroll: { marginTop: 20 },
  typeScrollContent: { paddingHorizontal: 20, gap: 10 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: SIZES.radius.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.textInverse },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 28, marginBottom: 16 },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  featuredList: { paddingHorizontal: 20, gap: 16 },
  loadingBox: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },

  nearbyCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: COLORS.bg, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOWS.sm },
  nearbyImage: { width: 120, height: 120 },
  nearbyInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  nearbyLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyStats: { flexDirection: 'row', gap: 14, marginTop: 8 },
  nearbyStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyStatText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
});
