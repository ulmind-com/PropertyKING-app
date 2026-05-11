import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../theme';
import { favoriteAPI } from '../../api';
import PropertyCard from '../../components/PropertyCard';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await favoriteAPI.list(); setFavorites(r.data?.favorites || []); } catch(e) {} setLoading(false); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}><Text style={FONTS.h2}>Favorites</Text><Text style={FONTS.caption}>{favorites.length} saved</Text></View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> :
        <FlatList data={favorites} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyCard property={item.property || item} variant="list" onPress={() => navigation.navigate('PropertyDetails', { slug: item.property?.slug || item.id, property: item.property || item })} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="heart-outline" size={48} color={COLORS.border} /><Text style={FONTS.body}>No favorites yet</Text></View>}
        />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
});
