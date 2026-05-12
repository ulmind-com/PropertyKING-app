import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      return setError('Please fill all fields');
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return setError('Please enter a valid phone number');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true); setError('');
    try {
      const cleanPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      await register({ full_name: fullName, email, phone: cleanPhone, password });
    } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Registration failed')); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={[FONTS.h1, { marginTop: 24 }]}>Create Account</Text>
        <Text style={[FONTS.body, { marginTop: 6 }]}>Join PropertyKING today</Text>

        {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color={COLORS.error} /><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputBox}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇺🇸</Text>
                <Text style={styles.codeText}>+1</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput 
                style={styles.input} 
                placeholder="(555) 123-4567" 
                placeholderTextColor={COLORS.textMuted} 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="Create password (min 6 chars)" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} /></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.signupBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.signupBtnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomText}>
          <Text style={FONTS.body}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },

  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.errorLight, padding: 14, borderRadius: SIZES.radius.md, marginTop: 20 },
  errorText: { fontSize: 13, color: COLORS.error, fontWeight: '500', flex: 1 },

  form: { marginTop: 32, gap: 20 },

  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: COLORS.borderLight },
  input: { flex: 1, fontSize: 14, color: COLORS.text },

  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  phoneDivider: { width: 1, height: 24, backgroundColor: COLORS.borderLight, marginHorizontal: 4 },

  signupBtn: { height: 54, backgroundColor: COLORS.primary, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: 12, ...SHADOWS.primary },
  signupBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  bottomText: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 20 },
  signInLink: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
