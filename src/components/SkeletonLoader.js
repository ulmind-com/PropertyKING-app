import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SIZES } from '../theme';

const { width } = Dimensions.get('window');

const Shimmer = ({ w, h, r = 8, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: COLORS.border, opacity }, style]} />;
};

export function PropertyCardSkeleton() {
  return (
    <View style={s.card}>
      <Shimmer w={'100%'} h={200} r={0} />
      <View style={{ padding: 16, gap: 8 }}>
        <Shimmer w={'80%'} h={20} />
        <Shimmer w={'50%'} h={14} />
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
          <Shimmer w={50} h={14} />
          <Shimmer w={50} h={14} />
          <Shimmer w={50} h={14} />
        </View>
        <Shimmer w={100} h={24} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function TypesSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
      {[1, 2, 3, 4].map(i => <Shimmer key={i} w={80} h={40} r={20} />)}
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={{ padding: 20, gap: 20, paddingTop: 8 }}>
      <TypesSkeleton />
      <View style={{ gap: 12 }}>
        <Shimmer w={120} h={20} />
        <PropertyCardSkeleton />
      </View>
      <View style={{ gap: 12 }}>
        <Shimmer w={100} h={20} />
        <PropertyCardSkeleton />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 20 },
});

export default Shimmer;
