import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill all fields');
    setLoading(true); setError('');
    try { await login(email, password); } catch (e) { 
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Invalid credentials')); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}><Ionicons name="home" size={28} color="#FFF" /></View>
          <Text style={styles.logoText}>Property<Text style={{ color: COLORS.primary }}>KING</Text></Text>
        </View>

        <Text style={[FONTS.h1, { marginTop: 40 }]}>Welcome Back</Text>
        <Text style={[FONTS.body, { marginTop: 6 }]}>Sign in to continue</Text>

        {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color={COLORS.error} /><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} /></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity><Text style={styles.forgotText}>Forgot Password?</Text></TouchableOpacity>

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomText}>
          <Text style={FONTS.body}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80 },

  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.errorLight, padding: 14, borderRadius: SIZES.radius.md, marginTop: 20 },
  errorText: { fontSize: 13, color: COLORS.error, fontFamily: 'Raleway_500Medium' },

  form: { marginTop: 32, gap: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.textSecondary },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: COLORS.borderLight },
  input: { flex: 1, fontSize: 14, color: COLORS.text },

  forgotText: { color: COLORS.primary, fontSize: 13, fontFamily: 'Raleway_600SemiBold', alignSelf: 'flex-end' },

  loginBtn: { height: 54, backgroundColor: COLORS.primary, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...SHADOWS.primary },
  loginBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Raleway_700Bold' },

  bottomText: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  signupLink: { color: COLORS.primary, fontFamily: 'Raleway_700Bold', fontSize: 14 },
});
