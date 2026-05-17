import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator, ScrollView, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { authAPI } from '../../api';

const { width } = Dimensions.get('window');

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

export default function ForgotPasswordScreen({ navigation }) {
  // Form State
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const animateSlide = (direction) => {
    slideXAnim.setValue(direction === 'next' ? 50 : -50);
    Animated.spring(slideXAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }).start();
  };

  const handleRequestOTP = async () => {
    if (!email || !email.includes('@')) return setError('Please enter a valid email address.');
    setLoading(true); setError('');
    try {
      await authAPI.requestOTP({ email, purpose: 'reset' });
      setStep(2);
      animateSlide('next');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to send OTP.'));
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return setError('Please enter the 6-digit OTP.');
    setLoading(true); setError('');
    try {
      await authAPI.verifyOTP({ email, otp, purpose: 'reset' });
      setStep(3);
      animateSlide('next');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Invalid or expired OTP.'));
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); setError('');
    try { 
      await authAPI.resetPassword({ email, otp, new_password: password });
      // Show success toast or simply navigate back
      navigation.navigate('Login');
    } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Password reset failed.')); 
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      animateSlide('prev');
      setError('');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
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
            <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideXAnim }], flex: 1, justifyContent: 'center' }}>
            
            {/* Header area */}
            <View style={styles.headerArea}>
              <Text style={styles.mainTitle}>
                {step === 1 ? "Reset Password" : step === 2 ? "Verify OTP" : "New Password"}
              </Text>
              <Text style={styles.subTitle}>
                {step === 1 ? "Enter your email to receive an OTP." : step === 2 ? "Enter the 6-digit OTP sent to your email." : "Make it strong and secure."}
              </Text>
            </View>

            {/* Form Area */}
            <View style={styles.formContainer}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* STEP 1: EMAIL */}
              {step === 1 && (
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
                      autoFocus
                    />
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <GlassyWhiteButton title="Send OTP" icon="arrow-forward" onPress={handleRequestOTP} loading={loading} />
                  </View>
                </View>
              )}

              {/* STEP 2: OTP */}
              {step === 2 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput 
                      style={[styles.input, { letterSpacing: 6, fontSize: 20 }]}
                      placeholder="------"
                      placeholderTextColor="#6B7280"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <GlassyWhiteButton title="Verify OTP" icon="checkmark-circle" onPress={handleVerifyOTP} loading={loading} />
                  </View>
                  <TouchableOpacity onPress={handleRequestOTP} style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text style={{ color: '#9CA3AF', fontFamily: 'Raleway_600SemiBold', fontSize: 14 }}>Resend Code</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: PASSWORD */}
              {step === 3 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#6B7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPass}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPass(!showPass)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <GlassyWhiteButton title="Reset Password" icon="checkmark" onPress={handleResetPassword} loading={loading} />
                  </View>
                </View>
              )}

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
    marginTop: Platform.OS === 'ios' ? 40 : 30, marginBottom: 30,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, paddingHorizontal: 40 },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressDotActive: { backgroundColor: '#FFF', shadowColor: '#FFF', shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width:0, height:0 } },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8, borderRadius: 2 },
  progressLineActive: { backgroundColor: '#FFF' },

  headerArea: { marginBottom: 32 },
  mainTitle: { fontSize: 32, fontFamily: 'Raleway_800ExtraBold', color: '#FFF', marginBottom: 12, letterSpacing: -0.5 },
  subTitle: { fontSize: 16, fontFamily: 'Raleway_400Regular', color: '#9CA3AF', lineHeight: 24 },

  formContainer: { gap: 16 },
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

  glassBtnWrapper: {
    borderRadius: 100, overflow: 'hidden', shadowColor: '#FFF', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, marginTop: 10
  },
  glassBtnInner: { height: 60, alignItems: 'center', justifyContent: 'center' },
  glassBtnText: { color: '#000', fontSize: 18, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 }
});
