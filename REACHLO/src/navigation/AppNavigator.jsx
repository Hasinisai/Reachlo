import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import BuyerLoginScreen from '../screens/BuyerLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SellerRegisterStep1Screen from '../screens/SellerRegisterStep1Screen';
import SellerRegisterStep2Screen from '../screens/SellerRegisterStep2Screen';
import SellerDashboardScreen from '../screens/placeholders/SellerDashboardScreen';
import DiscoveryFeedScreen from '../screens/placeholders/DiscoveryFeedScreen';
import AdminDashboardScreen from '../screens/placeholders/AdminDashboardScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SellerProfileScreen from '../screens/placeholders/SellerProfileScreen';
import AICampaignGenerateScreen from '../screens/placeholders/AICampaignGenerateScreen';
import AIDraftReviewScreen from '../screens/placeholders/AIDraftReviewScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      {/* Entry Screen */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />

      {/* Landing */}
      <Stack.Screen
        name="Landing"
        component={LandingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />

      {/* Auth Screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <Stack.Screen
        name="BuyerLogin"
        component={BuyerLoginScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      {/* Buyer registration (unchanged) */}
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      {/* Seller two-step registration — Step 1 & Step 2 */}
      <Stack.Screen
        name="SellerRegisterStep1"
        component={SellerRegisterStep1Screen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <Stack.Screen
        name="SellerRegisterStep2"
        component={SellerRegisterStep2Screen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />

      {/* Dashboards */}
      <Stack.Screen
        name="SellerDashboard"
        component={SellerDashboardScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />
      <Stack.Screen
        name="DiscoveryFeed"
        component={DiscoveryFeedScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />

      {/* Seller Profile Edit */}
      <Stack.Screen
        name="SellerProfile"
        component={SellerProfileScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />

      {/* AI Campaign Generation flow */}
      <Stack.Screen
        name="AIGenerate"
        component={AICampaignGenerateScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <Stack.Screen
        name="AIDraftReview"
        component={AIDraftReviewScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </Stack.Navigator>
  );
}
