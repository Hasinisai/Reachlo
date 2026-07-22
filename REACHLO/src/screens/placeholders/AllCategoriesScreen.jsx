import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import apiService from '../../services/apiService';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3; // 3 columns with padding

const SERVICES_DATA = [
  {
    id: 'it',
    title: 'IT & Technology',
    icon: require('../../../assets/ICONS/CATEGORY/it_and_technology.png'),
    offersCount: 0,
  },
  {
    id: 'edu',
    title: 'Education',
    icon: require('../../../assets/ICONS/CATEGORY/education.png'),
    offersCount: 0,
  },
  {
    id: 'health',
    title: 'Health',
    icon: require('../../../assets/ICONS/CATEGORY/health.png'),
    offersCount: 0,
  },
  {
    id: 'beauty',
    title: 'Beauty',
    icon: require('../../../assets/ICONS/CATEGORY/beauty.png'),
    offersCount: 0,
  },
  {
    id: 'food',
    title: 'Food',
    icon: require('../../../assets/ICONS/CATEGORY/food.png'),
    offersCount: 0,
  },
  {
    id: 'events',
    title: 'Events',
    icon: require('../../../assets/ICONS/CATEGORY/events.png'),
    offersCount: 0,
  },
  {
    id: 'realestate',
    title: 'Real Estate',
    icon: require('../../../assets/ICONS/CATEGORY/real_estate.png'),
    offersCount: 0,
  },
  {
    id: 'transport',
    title: 'Transport & Delivery',
    icon: require('../../../assets/ICONS/CATEGORY/transport.png'),
    offersCount: 0,
  },
  {
    id: 'auto',
    title: 'Automotive',
    icon: require('../../../assets/ICONS/CATEGORY/automotive.png'),
    offersCount: 0,
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: require('../../../assets/ICONS/CATEGORY/finance.png'),
    offersCount: 0,
  },
  {
    id: 'legal',
    title: 'Legal Services',
    icon: require('../../../assets/ICONS/CATEGORY/legal.png'),
    offersCount: 0,
  },
  {
    id: 'home',
    title: 'Home Services',
    icon: require('../../../assets/ICONS/CATEGORY/home_services.png'),
    offersCount: 0,
  },
  {
    id: 'travel',
    title: 'Travel & Tourism',
    icon: require('../../../assets/ICONS/CATEGORY/travel.png'),
    offersCount: 0,
  },
  {
    id: 'shopping',
    title: 'Shopping & Retail',
    icon: require('../../../assets/ICONS/CATEGORY/shopping.png'),
    offersCount: 0,
  },
];

const getCategoryServiceId = (categoryName) => {
  let catName = categoryName || '';
  if (catName.includes('::')) {
    catName = catName.split('::')[0];
  }
  if (catName === 'IT & Technology Services') return 'it';
  if (catName === 'Education & Training') return 'edu';
  if (catName === 'Health & Wellness') return 'health';
  if (catName === 'Beauty & Personal Care') return 'beauty';
  if (catName === 'Food & Restaurants') return 'food';
  if (catName === 'Events & Entertainment') return 'events';
  if (catName === 'Real Estate & Property') return 'realestate';
  if (catName === 'Transport & Delivery') return 'transport';
  if (catName === 'Automotive Services') return 'auto';
  if (catName === 'Finance & Insurance') return 'finance';
  if (catName === 'Legal & Compliance') return 'legal';
  if (catName === 'Home & Repair Services') return 'home';
  if (catName === 'Travel & Tourism') return 'travel';
  if (catName === 'Shopping & Retail') return 'shopping';
  return 'other';
};

export default function AllCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState(SERVICES_DATA);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Fetch active campaigns and calculate counts
    const fetchCampaigns = async () => {
      try {
        const fetched = await apiService.get('/campaigns');
        const counts = {};
        
        fetched.forEach((camp) => {
          const serviceId = getCategoryServiceId(camp.category);
          counts[serviceId] = (counts[serviceId] || 0) + 1;
        });

        setCategories(
          SERVICES_DATA.map((service) => ({
            ...service,
            offersCount: counts[service.id] || 0,
          }))
        );
      } catch (e) {
        console.warn('Failed to fetch offer counts for categories:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (category) => {
    // Navigate back to DiscoveryFeed and select this category
    navigation.navigate('DiscoveryFeed', { selectedCategoryId: category.id });
  };

  const renderCategoryCard = ({ item }) => {
    // Card press scale animation setup
    const scaleValue = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleValue }] }]}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleCategoryPress(item)}
          style={styles.cardPressable}
        >
          <View style={styles.iconContainer}>
            <Image source={item.icon} style={styles.iconImage} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.offersCount} active</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Orbs */}
      <View style={styles.bgOrbOne} pointerEvents="none" />
      <View style={styles.bgOrbTwo} pointerEvents="none" />

      {/* Header */}
      <LinearGradient colors={['#EFF6FF', '#DBEAFE', '#FFFFFF']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>All Categories</Text>
            <Text style={styles.subtitle}>Explore businesses and offers across every category.</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#2563EB" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories Grid */}
      <Animated.View style={[styles.gridContainer, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search query</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryCard}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgOrbOne: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E0F2FE',
    top: -50,
    left: -50,
    opacity: 0.6,
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EFF6FF',
    bottom: -100,
    right: -100,
    opacity: 0.6,
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
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.SM,
    color: '#1E293B',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  gridContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardContainer: {
    width: CARD_SIZE - 8,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardPressable: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: FONT_WEIGHTS.BOLD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: FONT_SIZES.SM,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#334155',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.SM,
    color: '#64748B',
    marginTop: 4,
  },
});
