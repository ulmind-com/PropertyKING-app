import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CountryPicker from 'react-native-country-picker-modal';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const initialPhone = user?.phone || '';
  const isIN = initialPhone.startsWith('+91');
  const initialCallingCode = isIN ? '91' : '1';
  const initialCountry = isIN ? 'IN' : 'US';
  const initialRawPhone = initialPhone.replace(`+${initialCallingCode}`, '').trim();

  const [countryCode, setCountryCode] = useState(initialCountry);
  const [callingCode, setCallingCode] = useState(initialCallingCode);
  const [rawPhone, setRawPhone] = useState(initialRawPhone);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    company_name: user?.company_name || '',
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleAvatarUpload(result.assets[0]);
    }
  };

  const handleAvatarUpload = async (asset) => {
    setUploadingAvatar(true);
    try {
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const fileToUpload = {
        uri: asset.uri,
        name: filename,
        type,
      };

      const res = await userAPI.updateAvatar(fileToUpload);
      await updateUser(res.data);
      Toast.show({ type: 'success', text1: 'Profile Picture Updated!' });
    } catch (e) {
      console.log('Avatar upload error:', e.response?.data || e);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) return Alert.alert('Error', 'Name is required');
    
    setLoading(true);
    try {
      const dataToSave = { ...formData, phone: `+${callingCode}${rawPhone}` };
      const res = await userAPI.updateMe(dataToSave);
      await updateUser(res.data);
      Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{user?.full_name?.[0] || 'U'}</Text>
              </View>
            )}
            
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
            
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        {/* Form Fields Card */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <View style={styles.iconBox}><Ionicons name="person-outline" size={18} color={COLORS.primary} /></View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.inputRaw} 
                value={formData.full_name} 
                onChangeText={(t) => setFormData({...formData, full_name: t})} 
                placeholder="John Doe" 
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <View style={styles.iconBox}><Ionicons name="call-outline" size={18} color={COLORS.primary} /></View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneInputWrap}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withCallingCodeButton
                  onSelect={(country) => {
                    setCountryCode(country.cca2);
                    setCallingCode(country.callingCode[0]);
                  }}
                  containerButtonStyle={styles.countryPickerBtn}
                />
                <TextInput 
                  style={[styles.inputRaw, { flex: 1 }]} 
                  value={rawPhone} 
                  onChangeText={setRawPhone} 
                  placeholder="234 567 8900" 
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.inputRow, { alignItems: 'flex-start' }]}>
            <View style={[styles.iconBox, { marginTop: 4 }]}><Ionicons name="information-circle-outline" size={18} color={COLORS.primary} /></View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput 
                style={[styles.inputRaw, styles.textArea]} 
                value={formData.bio} 
                onChangeText={(t) => setFormData({...formData, bio: t})} 
                placeholder="Tell us about yourself..." 
                multiline 
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {user?.role === 'lister' && (
            <>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <View style={styles.iconBox}><Ionicons name="business-outline" size={18} color={COLORS.primary} /></View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Company Name</Text>
                  <TextInput 
                    style={styles.inputRaw} 
                    value={formData.company_name} 
                    onChangeText={(t) => setFormData({...formData, company_name: t})} 
                    placeholder="Your Agency / Company" 
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtnBottom} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  
  content: { padding: 20, paddingBottom: 100 },
  
  avatarSection: { alignItems: 'center', marginBottom: 36, marginTop: 10 },
  avatarWrap: { position: 'relative', width: 110, height: 110, borderRadius: 55, marginBottom: 16, ...SHADOWS.md },
  avatarImg: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.bgAlt },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { fontSize: 44, fontWeight: '800', color: COLORS.primary },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: COLORS.bg },
  changePhotoText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  formContainer: { backgroundColor: COLORS.bg, borderRadius: 24, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bgAlt, alignItems: 'center', justifyContent: 'center' },
  inputContent: { flex: 1, justifyContent: 'center' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  inputRaw: { fontSize: 16, fontWeight: '600', color: COLORS.text, padding: 0, margin: 0 },
  phoneInputWrap: { flexDirection: 'row', alignItems: 'center' },
  countryPickerBtn: { marginRight: 8, paddingVertical: 4 },
  textArea: { height: 70, paddingTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: 70 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  saveBtnBottom: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
