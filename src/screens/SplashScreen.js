import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreenComponent() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 20,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      // Pulsing effect after appearance
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      )
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Deep elegant background gradient */}
      <LinearGradient
        colors={['#050505', '#1a1a1a', '#050505']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
        <View style={styles.logoBox}>
          <View style={styles.logoInner} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>Property</Text>
          <Text style={styles.kingText}>KING</Text>
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
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    marginBottom: 45,
    shadowColor: '#8B5CF6', // Purple glowing shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  logoInner: {
    width: 32,
    height: 32,
    backgroundColor: '#050505',
    borderRadius: 10,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 44,
    fontFamily: 'Raleway_800ExtraBold',
    color: '#FFF',
    letterSpacing: -1.5,
  },
  kingText: {
    fontSize: 44,
    fontFamily: 'Raleway_800ExtraBold',
    color: '#8B5CF6',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Raleway_500Medium',
    color: '#A1A1AA',
    marginTop: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
