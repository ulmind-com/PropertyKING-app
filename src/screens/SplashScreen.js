import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

export default function SplashScreenComponent() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 20,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
        <View style={styles.logoBox}>
          <View style={styles.logoInner} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>PropertyKING</Text>
        </View>
        <Text style={styles.subtitle}>Unlock Premium Real Estate</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  content: {
    alignItems: 'center',
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    marginBottom: 40,
  },
  logoInner: {
    width: 24,
    height: 24,
    backgroundColor: '#050505',
    borderRadius: 6,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 38,
    fontFamily: 'Raleway_800ExtraBold',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Raleway_500Medium',
    color: '#888',
    marginTop: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
