import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import InputField from '../../components/InputField';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

export default function SellerEditProfileScreen({ navigation }) {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [loading, setLoading] = useState(false);

  const validateEmail = (text) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'City cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.request('/auth/me', {
        method: 'PATCH',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/[^0-9]/g, ''),
          city: city.trim(),
        },
      });

      if (updateUserProfile) {
        updateUserProfile({
          name: response.name,
          email: response.email,
          phone: response.phone,
          city: response.city,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <LinearGradient colors={['#EFF6FF', '#DBEAFE', '#FFFFFF']} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Edit Profile</Text>
              <Text style={styles.subtitle}>Update your contact and personal information.</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <InputField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
            />
            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
            />
            <InputField
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.buttonContainer}>
              <Pressable onPress={handleSave} style={styles.saveButton}>
                <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.buttonGradient}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </Pressable>
              
              <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.LG,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: FONT_SIZES.XS,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    borderRadius: 18,
    height: 52,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZES.SM,
  },
  cancelButton: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: FONT_SIZES.SM,
  },
});
