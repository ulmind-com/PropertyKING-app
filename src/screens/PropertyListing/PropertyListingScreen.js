import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { propertyAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';

export default function PropertyListingScreen({ navigation, route }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const params = route.params || {};

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await propertyAPI.list({ page, limit: 20, ...params });
      setProperties(res.data?.properties || []);
      setTotal(res.data?.total || 0);
    } catch(e) { console.log(e); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={FONTS.h3}>{params.typeName || 'Properties'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Filters')} style={styles.filterIcon}>
          <Ionicons name="options-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.count}>{total} properties found</Text>

      {loading ? (
        <View style={styles.loadingView}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PropertyCard property={item} variant="list"
              onPress={() => navigation.navigate('PropertyDetails', { slug: item.slug || item.id, property: item })}
              style={{ marginHorizontal: 20 }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}><Ionicons name="search-outline" size={48} color={COLORS.border} /><Text style={FONTS.body}>No properties found</Text></View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  count: { ...FONTS.caption, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingBottom: 100 },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
});
