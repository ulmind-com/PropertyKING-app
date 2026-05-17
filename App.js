import 'react-native-gesture-handler';
import React, { useEffect, useCallback } from 'react';
import { StatusBar, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CompareProvider } from './src/context/CompareContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { 
  useFonts,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold 
} from '@expo-google-fonts/raleway';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// OP Premium Toast Config
const toastConfig = {
  success: (props) => (
    <View style={{ width: '90%', backgroundColor: '#111827', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Raleway_700Bold' }}>{props.text1}</Text>
        {props.text2 ? <Text style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Raleway_500Medium', marginTop: 2 }}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  error: (props) => (
    <View style={{ width: '90%', backgroundColor: '#111827', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <Ionicons name="alert-circle" size={24} color="#EF4444" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Raleway_700Bold' }}>{props.text1}</Text>
        {props.text2 ? <Text style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Raleway_500Medium', marginTop: 2 }}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  info: (props) => (
    <View style={{ width: '90%', backgroundColor: '#111827', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <Ionicons name="information-circle" size={24} color="#3B82F6" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Raleway_700Bold' }}>{props.text1}</Text>
        {props.text2 ? <Text style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Raleway_500Medium', marginTop: 2 }}>{props.text2}</Text> : null}
      </View>
    </View>
  )
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <CompareProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <AppNavigator />
            <Toast config={toastConfig} />
          </CompareProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
