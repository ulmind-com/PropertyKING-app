import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Glassy White Button Component
const GlassyWhiteButton = ({ title, icon, onPress, loading }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={(e) => { Vibration.vibrate(20); if(onPress) onPress(e); }} disabled={loading} style={styles.glassBtnWrapper}>
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassBtnInner}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {icon && <Ionicons name={icon} size={20} color="#FFF" />}
            <Text style={styles.glassBtnText}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
    <View style={{ flex: 1, backgroundColor: '#050505' }}>
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

        {/* Wave replacement using View with borderRadius */}
        <View style={styles.waveContainer}>
          <View style={{ width: width * 2, height: 100, backgroundColor: '#FFFFFF', borderBottomLeftRadius: width, borderBottomRightRadius: width, alignSelf: 'center', marginLeft: -width / 2 }} />
        </View>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1, backgroundColor: '#050505', opacity: fadeAnim }}
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
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput}
                placeholder="••••••••••••"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                textAlign="center"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPass(!showPass)}
                hitSlop={{top:10, bottom:10, left:10, right:10}}
              >
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <View style={{ marginTop: 20 }}>
            <GlassyWhiteButton 
              title="Sign In" 
              icon="log-in-outline"
              onPress={handleLogin}
              loading={loading}
            />
          </View>
          
        </View>
      </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    height: 56,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Raleway_500Medium',
    paddingLeft: 44, // Offset the eye icon to keep text centered visually
    paddingRight: 10,
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
  },

  glassBtnWrapper: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Raleway_700Bold',
    letterSpacing: 1,
  },
});
