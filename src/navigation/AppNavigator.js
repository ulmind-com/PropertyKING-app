import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
import AddPropertyScreen from '../screens/AddProperty/AddPropertyScreen';

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

function FavStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavMain" component={FavoritesScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Custom center "+" tab button
function AddTabButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress} activeOpacity={0.85}>
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
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          height: 75,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={PropertyListingScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Home', { screen: 'PropertyListing' }); }
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
            e.preventDefault();
            navigation.navigate('AddProperty');
          },
        })}
      />
      <Tab.Screen name="Favorites" component={FavStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
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
