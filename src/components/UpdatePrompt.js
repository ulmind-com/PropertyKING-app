import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS, FONTS, SHADOWS } from '../theme';

// Store identifiers
const ANDROID_PKG = 'com.propertykingpro.app';
const IOS_BUNDLE = 'com.propertykingpro.app';
const PLAY_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PKG}`;
const APP_STORE_URL = 'https://apps.apple.com/app/id000000000';

// true if `remote` semver is strictly newer than `current`
function isNewer(remote, current) {
  const r = String(remote).split('.').map(n => parseInt(n, 10) || 0);
  const c = String(current).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const a = r[i] || 0, b = c[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

// Read the live version published on the store. Fails silently (returns null).
async function fetchStoreVersion() {
  try {
    if (Platform.OS === 'ios') {
      const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE}`);
      const json = await res.json();
      return json?.results?.[0]?.version || null;
    }
    // Android: parse the public Play Store listing for the current version
    const res = await fetch(`${PLAY_URL}&hl=en&gl=US`);
    const text = await res.text();
    const m =
      text.match(/\[\[\["(\d+\.\d+(?:\.\d+)?)"\]\]/) ||
      text.match(/Current Version[\s\S]{0,80}?(\d+\.\d+(?:\.\d+)?)/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

export default function UpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const currentVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const storeVersion = await fetchStoreVersion();
      if (mounted && storeVersion && isNewer(storeVersion, currentVersion)) {
        setVisible(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openStore = () => {
    Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_URL).catch(() => {});
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
      <View style={st.backdrop}>
        <View style={st.card}>
          <View style={st.iconCircle}>
            <Ionicons name="rocket-outline" size={30} color="#FFF" />
          </View>
          <Text style={st.title}>Update Available</Text>
          <Text style={st.message}>
            A new version of PropertyKing is available with new features and improvements.
            Update now for the best experience.
          </Text>
          <TouchableOpacity style={st.primaryBtn} activeOpacity={0.85} onPress={openStore}>
            <Ionicons name="logo-google-playstore" size={18} color="#FFF" />
            <Text style={st.primaryBtnText}>Update Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.laterBtn} activeOpacity={0.7} onPress={() => setVisible(false)}>
            <Text style={st.laterBtnText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.bg || '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...(SHADOWS?.md || {}),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary || '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Raleway_800ExtraBold',
    color: COLORS.text || '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Raleway_500Medium',
    color: COLORS.textSecondary || '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary || '#111827',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Raleway_700Bold',
  },
  laterBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  laterBtnText: {
    color: COLORS.textMuted || '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Raleway_600SemiBold',
  },
});
