import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';

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
        <Image 
          source={require('../../assets/logoremovebg.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>PropertyKing</Text>
        </View>
        <Text style={styles.subtitle}>Distressed & Off-Market Properties</Text>
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
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 30,
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
