import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

// Custom animated Input component for premium feel
const AnimatedInput = ({ icon, label, password, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.borderLight, COLORS.primary]
  });

  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor, borderWidth }]}>
        <Ionicons name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.textMuted} />
        <TextInput 
          style={styles.input} 
          placeholderTextColor={COLORS.textMuted} 
          secureTextEntry={password && !showPass}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props} 
        />
        {password && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Entrance Animations
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
    try { await login(email, password); } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Invalid credentials. Please try again.')); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Premium Gradient Header Background */}
      <View style={styles.headerBackground}>
        <LinearGradient
          colors={['#1E1B4B', '#4C1D95', COLORS.bg]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoIcon}><Ionicons name="home" size={32} color="#FFF" /></View>
          <Text style={styles.logoText}>Property<Text style={{ color: COLORS.primary }}>KING</Text></Text>
        </Animated.View>
      </View>

      {/* Main Content Area with overlapping card design */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your premium properties.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <AnimatedInput 
              icon="mail-outline" 
              label="Email Address" 
              placeholder="e.g. john@propertyking.com" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none" 
            />

            <AnimatedInput 
              icon="lock-closed-outline" 
              label="Password" 
              placeholder="Enter your secure password" 
              value={password} 
              onChangeText={setPassword} 
              password 
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 10 }}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} disabled={loading}>
                <LinearGradient
                  colors={[COLORS.primary, '#6D28D9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.loginBtnText}>{loading ? 'Authenticating...' : 'Sign In'}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}}/>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomArea}>
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.bottomText}>
              <Text style={styles.bottomTextNormal}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Create one now</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  headerBackground: {
    height: height * 0.35,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -40 },
  logoIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoText: { fontSize: 32, fontFamily: 'Raleway_800ExtraBold', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  scroll: { 
    flexGrow: 1, 
    paddingTop: height * 0.28,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },

  title: { fontSize: 30, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: 'Raleway_500Medium', color: COLORS.textSecondary, marginTop: 8, marginBottom: 10, lineHeight: 22 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.errorLight, padding: 14, borderRadius: SIZES.radius.md, marginTop: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error, fontFamily: 'Raleway_600SemiBold', lineHeight: 18 },

  form: { marginTop: 32, gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.text, paddingLeft: 4 },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: COLORS.bgAlt, 
    borderRadius: SIZES.radius.lg, 
    paddingHorizontal: 18, 
    height: 58,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text, fontFamily: 'Raleway_500Medium', height: '100%' },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontFamily: 'Raleway_700Bold' },

  loginBtn: { 
    flexDirection: 'row',
    height: 60, 
    borderRadius: SIZES.radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.primary 
  },
  loginBtnText: { color: '#FFF', fontSize: 18, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 },

  bottomArea: { marginTop: 30 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  orText: { color: COLORS.textMuted, fontFamily: 'Raleway_600SemiBold', fontSize: 13 },

  socialBtn: { 
    flexDirection: 'row', 
    height: 56, 
    borderRadius: SIZES.radius.lg, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.bgAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12
  },
  socialBtnText: { color: COLORS.text, fontSize: 15, fontFamily: 'Raleway_700Bold' },

  bottomText: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  bottomTextNormal: { color: COLORS.textSecondary, fontFamily: 'Raleway_500Medium', fontSize: 15 },
  signupLink: { color: COLORS.primary, fontFamily: 'Raleway_800ExtraBold', fontSize: 15 },
});
