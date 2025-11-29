import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/job-card';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useDebounce } from '../../hooks/use-debounce';
import { useData } from '../../lib/data-context';
import { JobCategories, JobCategory } from '../../types/jobs';

export default function JobList() {
  const insets = useSafeAreaInsets();
  const { jobs, loadJobs, isLoading, errors } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load jobs when debounced search or category changes
  useEffect(() => {
    loadJobs({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: debouncedSearchQuery || undefined
    });
  }, [debouncedSearchQuery, selectedCategory]);

  // Category chips UI removed for now; default category is 'all'.

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined
    });
    setRefreshing(false);
  };

  if (isLoading.jobs && !refreshing && jobs.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  // Show error state with retry button
  if (errors.jobs && jobs.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <FontAwesome name="exclamation-circle" size={60} color={Colors[colorScheme].error} />
        <Text style={[styles.errorTitle, { color: Colors[colorScheme].text }]}>Noe gikk galt</Text>
        <Text style={[styles.errorMessage, { color: Colors[colorScheme].textMuted }]}>{errors.jobs}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={() => loadJobs({
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            search: debouncedSearchQuery || undefined
          })}
        >
          <FontAwesome name="refresh" size={16} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.retryButtonText}>Prøv igjen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Removed CategoryChips component to simplify the UI and avoid unused styles.

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      {/* FINN-style header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        {/* Search bar */}
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme].input, borderColor: Colors[colorScheme].border }]}>
          <FontAwesome name="search" size={18} color={Colors[colorScheme].textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Søk etter jobber"
            placeholderTextColor={Colors[colorScheme].textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category chips - FINN style */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && { backgroundColor: Colors[colorScheme].tint },
              selectedCategory !== 'all' && { backgroundColor: Colors[colorScheme].card, borderWidth: 1, borderColor: Colors[colorScheme].border }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryChipText,
              { color: selectedCategory === 'all' ? '#FFFFFF' : Colors[colorScheme].text }
            ]}>
              Alle
            </Text>
          </TouchableOpacity>
          {Object.entries(JobCategories).map(([key, label]) => {
            if (key === 'all') return null;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryChip,
                  selectedCategory === key && { backgroundColor: Colors[colorScheme].tint },
                  selectedCategory !== key && { backgroundColor: Colors[colorScheme].card, borderWidth: 1, borderColor: Colors[colorScheme].border }
                ]}
                onPress={() => setSelectedCategory(key as JobCategory)}
              >
                <Text style={[
                  styles.categoryChipText,
                  { color: selectedCategory === key ? '#FFFFFF' : Colors[colorScheme].text }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={jobs}
        initialNumToRender={6}
        windowSize={5}
        renderItem={({ item }) => (
          <JobCard 
            job={item}
            onPress={(job) => router.push({
              pathname: '/job/[id]',
              params: { id: job.id }
            })}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme].tint]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={50} color={Colors[colorScheme].textMuted} />
            <Text style={[styles.emptyText, { color: Colors[colorScheme].textMuted }]}>
              Ingen jobber funnet
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors[colorScheme].textMuted }]}>
              Prøv å endre søkekriteriene
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  row: {
    gap: 12,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
