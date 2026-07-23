import React, { useState, useEffect } from 'react';
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

export default function SellerEditBusinessScreen({ navigation }) {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [businessUsp, setBusinessUsp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBusinessDetails = async () => {
      try {
        const data = await apiService.get('/businesses/me');
        setBusinessName(data.name || '');
        setBusinessDesc(data.business_description || '');
        setBusinessUsp(data.usp || '');
      } catch (e) {
        console.warn('Failed to load business profile:', e);
        Alert.alert('Error', 'Failed to load business details.');
      } finally {
        setLoading(false);
      }
    };
    loadBusinessDetails();
  }, []);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Validation Error', 'Business name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: businessName.trim(),
        business_description: businessDesc.trim() || null,
        usp: businessUsp.trim() || null,
      };

      await apiService.request('/businesses/me', {
        method: 'PATCH',
        body: payload,
      });

      Alert.alert('Success', 'Business details updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update business details.');
    } finally {
      setSaving(false);
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
              <Text style={styles.title}>Edit Business Details</Text>
              <Text style={styles.subtitle}>Update your brand name, description and USP.</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching details...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <InputField
                label="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Company or Brand Name"
              />
              <InputField
                label="Business Description"
                value={businessDesc}
                onChangeText={setBusinessDesc}
                placeholder="What does your business provide?"
                multiline={true}
                numberOfLines={4}
                style={styles.textArea}
              />
              <InputField
                label="Business USP (Unique Selling Proposition)"
                value={businessUsp}
                onChangeText={setBusinessUsp}
                placeholder="What makes your business unique?"
                multiline={true}
                numberOfLines={3}
                style={styles.textArea}
              />
            </View>

            {saving ? (
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
        )}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: FONT_SIZES.SM,
  },
});
