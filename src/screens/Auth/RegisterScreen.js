import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
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
      setError(Array.isArray(detail) ? detail[0].msg : (detail || 'Registration failed.')); 
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
            {/* Back Button / Logo Box style */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.logoBox}>
              <Ionicons name="chevron-back" size={20} color="#FFF" style={{ transform: [{ rotate: '-45deg' }] }} />
            </TouchableOpacity>
            
            {/* Sign In Link */}
            <TouchableOpacity style={styles.signinLink} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={22} color="#000" />
              <Text style={styles.signinText}>Sign In</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.mainTitle}>Sign Up</Text>
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
        style={{ flex: 1, backgroundColor: '#050505', opacity: fadeAnim }}
      >
        <View style={styles.formContainer}>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#666"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              textAlign="center"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input}
              placeholder="john@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="center"
            />
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput 
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
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

          {/* Sign Up Button */}
          <View style={{ marginTop: 20 }}>
            <GradientBorderButton 
              title="Create Account" 
              icon="person-add-outline"
              onPress={handleRegister}
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
  signinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signinText: {
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
    paddingBottom: 20,
  },
  formContainer: {
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: -5,
  },
  inputGroup: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Raleway_600SemiBold',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Raleway_500Medium',
    paddingHorizontal: 24,
  },

  gradientBtnWrapper: {
    width: '100%',
    height: 54,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
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
