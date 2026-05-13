import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCompare } from '../context/CompareContext';
import { COLORS, FONTS, SHADOWS } from '../theme';

export default function FloatingCompareButton() {
  const { compareList } = useCompare();
  const navigation = useNavigation();

  if (compareList.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CompareScreen')}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{compareList.length}</Text>
        </View>
        <Text style={styles.text}>Compare Properties</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above bottom tabs
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 12,
    ...SHADOWS.md,
  },
  badge: {
    backgroundColor: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  text: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  }
});
