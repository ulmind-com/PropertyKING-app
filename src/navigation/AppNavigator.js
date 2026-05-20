import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Vibration, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import LocationPickerScreen from '../screens/Home/LocationPickerScreen';
import PropertyListingScreen from '../screens/PropertyListing/PropertyListingScreen';
import PropertyDetailsScreen from '../screens/PropertyDetails/PropertyDetailsScreen';
import FiltersScreen from '../screens/Filters/FiltersScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import AddPropertyScreen from '../screens/AddProperty/AddPropertyScreen';
import MyListingsScreen from '../screens/Profile/MyListingsScreen';
import PropertyLeadsScreen from '../screens/Profile/PropertyLeadsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import AllInquiriesScreen from '../screens/Profile/AllInquiriesScreen';
import CompareScreen from '../screens/PropertyListing/CompareScreen';
import MapExploreScreen from '../screens/Map/MapExploreScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import SplashScreenComponent from '../screens/SplashScreen';
import { PushNotificationService } from '../services/PushNotificationService';
import FloatingCompareButton from '../components/FloatingCompareButton';
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="PropertyListing" component={PropertyListingScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={PropertyListingScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapExploreScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} />
      <Stack.Screen name="PropertyLeads" component={PropertyLeadsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Inquiries" component={AllInquiriesScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Custom center "+" tab button
function AddTabButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={(e) => { Vibration.vibrate(20); if(onPress) onPress(e); }} activeOpacity={0.85}>
      <View style={styles.addBtnInner}>
        <Ionicons name="add" size={28} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}

// Dummy empty component for the Add tab (never rendered)
function EmptyScreen() { return null; }

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Home') {
            return (
              <Image
                source={require('../../assets/logoremovebg.png')}
                style={{ width: 26, height: 26, opacity: focused ? 1 : 0.45 }}
                resizeMode="contain"
              />
            );
          }
          let iconName;
          if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          height: 75,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Raleway_600SemiBold',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Vibration.vibrate(20);
            navigation.navigate('Home', { screen: 'HomeMain' });
          }
        })}
      />
      <Tab.Screen name="Explore" component={ExploreStack} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Vibration.vibrate(20);
            navigation.navigate('Explore', { screen: 'ExploreMain' });
          }
        })}
      />
      <Tab.Screen
        name="Add"
        component={EmptyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <AddTabButton {...props} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Vibration.vibrate(20);
            e.preventDefault();
            navigation.navigate('AddProperty');
          },
        })}
      />
      <Tab.Screen name="Map" component={MapStack} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Vibration.vibrate(20);
            navigation.navigate('Map', { screen: 'MapMain' });
          }
        })}
      />
      <Tab.Screen name="Profile" component={ProfileStack} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Vibration.vibrate(20);
          }
        })}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CompareScreen" component={CompareScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = React.useRef(null);
  const [routeName, setRouteName] = React.useState();

  React.useEffect(() => {
    let unsubs;
    if (isAuthenticated) {
      // Small timeout to ensure NavigationContainer is ready
      setTimeout(() => {
        unsubs = PushNotificationService.setupNotificationListeners(navigationRef.current);
      }, 1000);
    }
    return () => {
      if (unsubs) unsubs();
    };
  }, [isAuthenticated]);

  if (loading) return <SplashScreenComponent />;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setRouteName(navigationRef.current?.getCurrentRoute()?.name);
      }}
      onStateChange={() => {
        setRouteName(navigationRef.current?.getCurrentRoute()?.name);
      }}
    >
      {isAuthenticated ? <MainStack /> : <AuthStack />}
      {isAuthenticated && routeName !== 'CompareScreen' && <FloatingCompareButton />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
});
