import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user', // 'user' | 'lister'
    lister_type: '', // 'owner' | 'agent' | 'builder'
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.full_name) {
      return setError('Please fill all required fields');
    }
    if (form.role === 'lister' && !form.lister_type) {
      return setError('Please select a lister type');
    }
    
    setLoading(true); setError('');
    try {
      await register(form);
    } catch (e) { 
      setError(e.response?.data?.detail || 'Registration failed'); 
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
          <View style={styles.roleTabs}>
            <TouchableOpacity 
              style={[styles.roleTab, form.role === 'user' && styles.roleTabActive]}
              onPress={() => setForm({...form, role: 'user', lister_type: ''})}
            >
              <Ionicons name="person-outline" size={18} color={form.role === 'user' ? '#FFF' : COLORS.textSecondary} />
              <Text style={[styles.roleTabText, form.role === 'user' && styles.roleTabTextActive]}>Looking to Buy/Rent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, form.role === 'lister' && styles.roleTabActive]}
              onPress={() => setForm({...form, role: 'lister'})}
            >
              <Ionicons name="key-outline" size={18} color={form.role === 'lister' ? '#FFF' : COLORS.textSecondary} />
              <Text style={[styles.roleTabText, form.role === 'lister' && styles.roleTabTextActive]}>List Property</Text>
            </TouchableOpacity>
          </View>

          {form.role === 'lister' && (
            <View style={styles.listerTypeContainer}>
              <Text style={styles.label}>I am a...</Text>
              <View style={styles.listerTypeOptions}>
                {['owner', 'agent', 'builder'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.listerTypeBtn, form.lister_type === type && styles.listerTypeBtnActive]}
                    onPress={() => setForm({...form, lister_type: type})}
                  >
                    <Text style={[styles.listerTypeBtnText, form.lister_type === type && styles.listerTypeBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={COLORS.textMuted} value={form.full_name} onChangeText={(t) => setForm({...form, full_name: t})} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor={COLORS.textMuted} value={form.email} onChangeText={(t) => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.input} placeholder="Create password" placeholderTextColor={COLORS.textMuted} value={form.password} onChangeText={(t) => setForm({...form, password: t})} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} /></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomText}>
          <Text style={FONTS.body}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signupLink}>Sign In</Text>
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
  errorText: { fontSize: 13, color: COLORS.error, fontWeight: '500' },

  form: { marginTop: 32, gap: 20 },
  
  roleTabs: { flexDirection: 'row', backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, padding: 4 },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: SIZES.radius.sm },
  roleTabActive: { backgroundColor: COLORS.primary, ...SHADOWS.sm },
  roleTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  roleTabTextActive: { color: '#FFF' },

  listerTypeContainer: { gap: 8, marginTop: 4 },
  listerTypeOptions: { flexDirection: 'row', gap: 8 },
  listerTypeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: SIZES.radius.sm, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.bgAlt },
  listerTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  listerTypeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'capitalize' },
  listerTypeBtnTextActive: { color: COLORS.primary },

  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: COLORS.borderLight },
  input: { flex: 1, fontSize: 14, color: COLORS.text },

  loginBtn: { height: 54, backgroundColor: COLORS.primary, borderRadius: SIZES.radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: 12, ...SHADOWS.primary },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  bottomText: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 20 },
  signupLink: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
