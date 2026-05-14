import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Gradient Border Button Component
const GradientBorderButton = ({ title, icon, onPress, loading }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={loading} style={styles.gradientBtnWrapper}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.gradientBtnInner}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {icon && <Ionicons name={icon} size={20} color="#FFF" />}
              <Text style={styles.gradientBtnText}>{title}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return setError('Please enter your email and password.');
    setLoading(true); setError('');
    try { 
      await login(email, password); 
    } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Invalid credentials.')); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Top Wavy White Section */}
      <View style={styles.headerArea}>
        <View style={styles.headerContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {/* Logo */}
            <View style={styles.logoBox}>
              <View style={styles.logoInner} />
            </View>
            
            {/* Sign Up Link */}
            <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Register')}>
              <Ionicons name="person-outline" size={20} color="#000" />
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.mainTitle}>Sign In</Text>
        </View>

        {/* The Wave SVG */}
        <View style={styles.waveContainer}>
          <Svg height={100} width={width} viewBox={`0 0 ${width} 100`} preserveAspectRatio="none">
            <Path 
              d={`M0,0 L0,50 Q${width * 0.25},100 ${width * 0.5},50 T${width},0 L${width},0 Z`}
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.formContainer}>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. john@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="center"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign="center"
            />
          </View>

          {/* Sign In Button */}
          <View style={{ marginTop: 20 }}>
            <GradientBorderButton 
              title="Sign In" 
              icon="log-in-outline"
              onPress={handleLogin}
              loading={loading}
            />
          </View>
          
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  
  headerArea: {
    backgroundColor: '#050505',
    zIndex: 1,
  },
  headerContent: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }]
  },
  logoInner: {
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signupText: {
    fontSize: 16,
    fontFamily: 'Raleway_700Bold',
    color: '#000',
  },
  mainTitle: {
    fontSize: 42,
    fontFamily: 'Raleway_800ExtraBold',
    color: '#000',
    textAlign: 'center',
    marginBottom: -10,
  },
  waveContainer: {
    width: width,
    height: 100,
    backgroundColor: '#050505',
    marginTop: -1,
  },
  
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 10,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 24,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: -10,
  },
  inputGroup: {
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Raleway_600SemiBold',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Raleway_500Medium',
    paddingHorizontal: 24,
  },

  gradientBtnWrapper: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientBorder: {
    flex: 1,
    padding: 2, // Width of the gradient border
    borderRadius: 30,
  },
  gradientBtnInner: {
    flex: 1,
    backgroundColor: '#050505',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Raleway_700Bold',
  },
});
