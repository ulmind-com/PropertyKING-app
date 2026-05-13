import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
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
      const res = await userAPI.updateMe(formData);
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
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            value={formData.full_name} 
            onChangeText={(t) => setFormData({...formData, full_name: t})} 
            placeholder="John Doe" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            value={formData.phone} 
            onChangeText={(t) => setFormData({...formData, phone: t})} 
            placeholder="+1 234 567 8900" 
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={formData.bio} 
            onChangeText={(t) => setFormData({...formData, bio: t})} 
            placeholder="Tell us about yourself..." 
            multiline 
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {user?.role === 'lister' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput 
              style={styles.input} 
              value={formData.company_name} 
              onChangeText={(t) => setFormData({...formData, company_name: t})} 
              placeholder="Your Agency / Company" 
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: COLORS.bg },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  saveText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  
  content: { padding: 20 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrap: { position: 'relative', width: 100, height: 100, borderRadius: 50, marginBottom: 12, ...SHADOWS.md },
  avatarImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.bg },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { fontSize: 40, fontWeight: '800', color: COLORS.primary },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bg },
  changePhotoText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 15, color: COLORS.text, ...SHADOWS.sm },
  textArea: { height: 120, paddingTop: 16 },
});
