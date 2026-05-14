import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

// Custom animated Input component
const AnimatedInput = ({ icon, label, password, phone, value, onChangeText, ...props }) => {
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
        
        {phone ? (
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.codeText}>+1</Text>
            <View style={styles.phoneDivider} />
          </View>
        ) : (
          <Ionicons name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.textMuted} />
        )}
        
        <TextInput 
          style={styles.input} 
          placeholderTextColor={COLORS.textMuted} 
          secureTextEntry={password && !showPass}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={onChangeText}
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) return setError('Please fill out all fields.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid phone number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true); setError('');
    try {
      const cleanPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      await register({ full_name: fullName, email, phone: cleanPhone, password });
    } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Registration failed. Please try again.')); 
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
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PropertyKING to unlock premium real estate deals.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <AnimatedInput 
              icon="person-outline" 
              label="Full Name" 
              placeholder="e.g. John Doe" 
              value={fullName} 
              onChangeText={setFullName} 
              autoCapitalize="words" 
            />

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
              phone 
              label="Phone Number" 
              placeholder="(555) 123-4567" 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad"
              maxLength={15}
            />

            <AnimatedInput 
              icon="lock-closed-outline" 
              label="Password" 
              placeholder="Create a secure password" 
              value={password} 
              onChangeText={setPassword} 
              password 
            />

            <View style={{ marginTop: 10 }}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} disabled={loading}>
                <LinearGradient
                  colors={[COLORS.primary, '#6D28D9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.signupBtn, loading && { opacity: 0.7 }]}
                >
                  <Text style={styles.signupBtnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}}/>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomText}>
            <Text style={styles.bottomTextNormal}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In now</Text>
            </TouchableOpacity>
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
  },
  
  topNav: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },

  scroll: { 
    flexGrow: 1, 
    paddingTop: height * 0.12,
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

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.errorLight, padding: 14, borderRadius: SIZES.radius.md, marginTop: 15, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error, fontFamily: 'Raleway_600SemiBold', lineHeight: 18 },

  form: { marginTop: 24, gap: 20 },
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

  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flag: { fontSize: 20 },
  codeText: { fontSize: 15, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  phoneDivider: { width: 1.5, height: 26, backgroundColor: COLORS.borderLight, marginLeft: 4, marginRight: 4 },

  signupBtn: { 
    flexDirection: 'row',
    height: 60, 
    borderRadius: SIZES.radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.primary 
  },
  signupBtnText: { color: '#FFF', fontSize: 18, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 },

  bottomText: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 20 },
  bottomTextNormal: { color: COLORS.textSecondary, fontFamily: 'Raleway_500Medium', fontSize: 15 },
  signInLink: { color: COLORS.primary, fontFamily: 'Raleway_800ExtraBold', fontSize: 15 },
});
