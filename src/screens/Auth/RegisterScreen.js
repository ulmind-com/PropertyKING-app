import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator, ScrollView, Vibration, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';

const { width } = Dimensions.get('window');

// Common countries with emoji flags
const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dial: '91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dial: '1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dial: '1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dial: '61' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dial: '971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dial: '966' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dial: '65' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dial: '49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dial: '33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dial: '81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dial: '82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dial: '86' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dial: '55' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dial: '52' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dial: '7' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dial: '27' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dial: '234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dial: '254' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dial: '20' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dial: '92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dial: '880' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dial: '94' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dial: '977' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dial: '60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dial: '66' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dial: '63' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dial: '62' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dial: '39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dial: '34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dial: '31' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dial: '46' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dial: '41' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dial: '64' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dial: '353' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dial: '974' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dial: '965' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dial: '973' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dial: '968' },
];

// Custom Country Picker (no external deps)
const CountryCodePicker = ({ selected, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const current = COUNTRIES.find(c => c.code === selected) || COUNTRIES[0];
  const filtered = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  return (
    <>
      <TouchableOpacity 
        onPress={() => setVisible(true)} 
        style={cpStyles.trigger}
        activeOpacity={0.7}
      >
        <Text style={cpStyles.flag}>{current.flag}</Text>
        <Text style={cpStyles.dial}>+{current.dial}</Text>
        <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={cpStyles.overlay}>
          <View style={cpStyles.modal}>
            <View style={cpStyles.modalHeader}>
              <Text style={cpStyles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={cpStyles.searchBox}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={cpStyles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[cpStyles.row, item.code === selected && cpStyles.rowActive]}
                  onPress={() => { onSelect(item); setVisible(false); setSearch(''); }}
                >
                  <Text style={cpStyles.rowFlag}>{item.flag}</Text>
                  <Text style={cpStyles.rowName}>{item.name}</Text>
                  <Text style={cpStyles.rowDial}>+{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const cpStyles = StyleSheet.create({
  trigger: { 
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingRight: 10, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 12
  },
  flag: { fontSize: 20 },
  dial: { fontSize: 15, color: '#FFF', fontFamily: 'Raleway_600SemiBold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { 
    backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, 
    maxHeight: '70%', paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  modalTitle: { fontSize: 18, fontFamily: 'Raleway_700Bold', color: '#FFF' },
  searchBox: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, 
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, height: 48 
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15, fontFamily: 'Raleway_500Medium' },
  row: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  rowActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rowFlag: { fontSize: 22, marginRight: 14 },
  rowName: { flex: 1, fontSize: 15, color: '#E5E7EB', fontFamily: 'Raleway_500Medium' },
  rowDial: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Raleway_600SemiBold' },
});

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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  
  // Form State
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');
  
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

  const handleNextStep1 = () => {
    if (!email || !email.includes('@')) return setError('Please enter a valid email address.');
    setError('');
    
    // Optimistic UI transition
    setStep(2);
    animateSlide('next');
    
    // Background request
    authAPI.requestOTP({ email, purpose: 'registration' }).catch((e) => {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to send OTP.'));
      // Revert if failed (e.g., email already exists)
      setStep(1);
      animateSlide('prev');
    });
  };

  const handleNextStep2 = async () => {
    if (!otp || otp.length < 6) return setError('Please enter the 6-digit OTP.');
    setLoading(true); setError('');
    try {
      await authAPI.verifyOTP({ email, otp, purpose: 'registration' });
      setStep(3);
      animateSlide('next');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Invalid or expired OTP.'));
    }
    setLoading(false);
  };

  const handleNextStep3 = () => {
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    setError('');
    setStep(4);
    animateSlide('next');
  };

  const handleRegister = async () => {
    if (!name || !phone) return setError('Please fill out your name and phone number.');
    setLoading(true); setError('');
    try { 
      const fullPhone = `+${callingCode}${phone}`;
      await register({ email, password, full_name: name, phone: fullPhone }); 
    } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Registration failed.')); 
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
            {step === 1 && (
              <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signupText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 4 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 4 && styles.progressDotActive]} />
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideXAnim }], flex: 1, justifyContent: 'center' }}>
            
            {/* Header area */}
            <View style={styles.headerArea}>
              <Text style={styles.mainTitle}>
                {step === 1 ? "What's your email?" : step === 2 ? "Verify your email" : step === 3 ? "Create a password" : "Final details"}
              </Text>
              <Text style={styles.subTitle}>
                {step === 1 ? "We'll use this to log you in." : step === 2 ? "Enter the 6-digit OTP sent to your email." : step === 3 ? "Make it strong and secure." : "Help us identify you."}
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
                    <GlassyWhiteButton title="Continue" icon="arrow-forward" onPress={handleNextStep1} />
                  </View>
                </View>
              )}

              {/* STEP 2: OTP */}
              {step === 2 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.otpContainer}>
                    {[...Array(6)].map((_, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.otpBox, 
                          otp.length === index ? styles.otpBoxActive : null, 
                          otp.length > index ? styles.otpBoxFilled : null
                        ]}
                      >
                        <Text style={styles.otpText}>{otp[index] || ''}</Text>
                      </View>
                    ))}
                    <TextInput 
                      style={styles.hiddenOtpInput}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <GlassyWhiteButton title="Verify OTP" icon="checkmark-circle" onPress={handleNextStep2} loading={loading} />
                  </View>
                  <TouchableOpacity onPress={handleNextStep1} style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text style={{ color: '#9CA3AF', fontFamily: 'Raleway_600SemiBold', fontSize: 14 }}>Resend Code</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: PASSWORD */}
              {step === 3 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Secure Password</Text>
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
                    <GlassyWhiteButton title="Continue" icon="arrow-forward" onPress={handleNextStep3} />
                  </View>
                </View>
              )}

              {/* STEP 4: NAME & PHONE */}
              {step === 4 && (
                <View style={{ gap: 16 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#6B7280"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                      <CountryCodePicker 
                        selected={countryCode}
                        onSelect={(country) => {
                          setCountryCode(country.code);
                          setCallingCode(country.dial);
                        }}
                      />
                      <TextInput 
                        style={styles.input}
                        placeholder="234 567 8900"
                        placeholderTextColor="#6B7280"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <GlassyWhiteButton title="Complete Sign Up" icon="checkmark" onPress={handleRegister} loading={loading} />
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
  signupLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)'
  },
  signupText: { color: '#FFF', fontFamily: 'Raleway_600SemiBold', fontSize: 14 },

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
  glassBtnText: { color: '#000', fontSize: 18, fontFamily: 'Raleway_800ExtraBold', letterSpacing: 0.5 },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, position: 'relative' },
  otpBox: { 
    width: 48, height: 60, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center'
  },
  otpBoxActive: { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.1)' },
  otpBoxFilled: { borderColor: 'rgba(255,255,255,0.4)' },
  otpText: { fontSize: 24, fontFamily: 'Raleway_700Bold', color: '#FFF' },
  hiddenOtpInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 }
});
