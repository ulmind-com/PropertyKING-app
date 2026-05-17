import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator, Vibration, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// OP Premium Glassy Button
const GlassyWhiteButton = ({ title, icon, onPress, loading }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={(e) => { Vibration.vibrate(20); if(onPress) onPress(e); }} disabled={loading} style={styles.glassBtnWrapper}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassBtnInner}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon && <Ionicons name={icon} size={20} color="#000" />}
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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Absolute Background Gradient */}
      <LinearGradient
        colors={['#111827', '#050505', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Sign Up</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, justifyContent: 'center' }}>
            
            {/* Header area */}
            <View style={styles.headerArea}>
              <View style={styles.logoBadge}>
                <Ionicons name="home" size={32} color="#FFF" />
              </View>
              <Text style={styles.mainTitle}>Welcome Back</Text>
              <Text style={styles.subTitle}>Sign in to continue exploring premium properties.</Text>
            </View>

            {/* Form Area */}
            <View style={styles.formContainer}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#6B7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPass(!showPass)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPass} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 10 }}>
                <GlassyWhiteButton 
                  title="Sign In" 
                  onPress={handleLogin}
                  loading={loading}
                />
              </View>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 120, justifyContent: 'center' },
  
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 30, marginBottom: 40,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  signupLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)'
  },
  signupText: { color: '#FFF', fontFamily: 'Raleway_600SemiBold', fontSize: 14 },

  headerArea: { marginBottom: 40 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  mainTitle: { fontSize: 36, fontFamily: 'Raleway_800ExtraBold', color: '#FFF', marginBottom: 12, letterSpacing: -0.5 },
  subTitle: { fontSize: 16, fontFamily: 'Raleway_400Regular', color: '#9CA3AF', lineHeight: 24 },

  formContainer: { gap: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  errorText: { color: '#EF4444', fontFamily: 'Raleway_500Medium', flex: 1, fontSize: 14 },

  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Raleway_600SemiBold', color: '#E5E7EB', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, height: 60, paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 16, fontFamily: 'Raleway_500Medium', height: '100%' },
  eyeIcon: { padding: 8 },

  forgotPass: { alignSelf: 'flex-end', marginTop: -4 },
  forgotPassText: { color: '#9CA3AF', fontFamily: 'Raleway_500Medium', fontSize: 14 },

  glassBtnWrapper: {
    borderRadius: 100, overflow: 'hidden', shadowColor: '#FFF', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  glassBtnInner: { height: 60, alignItems: 'center', justifyContent: 'center' },
  glassBtnText: { color: '#000', fontSize: 18, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 }
});
