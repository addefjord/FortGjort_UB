import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/job-card';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useData } from '../../lib/data-context';

export default function MineJobberPage() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'mine' | 'påtatt'>('mine');
  const { myJobs, loadMyJobs, isLoading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyJobs();
    setRefreshing(false);
  };

  const currentJobs = activeTab === 'mine' ? myJobs.posted : myJobs.assigned;

  if (isLoading.myJobs && !refreshing && currentJobs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Mine jobber</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Mine jobber</Text>
        
        <View style={[styles.tabBar, { backgroundColor: Colors[colorScheme].card }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'mine' && { backgroundColor: Colors[colorScheme].tint }]}
            onPress={() => setActiveTab('mine')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'mine' ? '#FFFFFF' : Colors[colorScheme].textMuted }]}>
              Mine oppdrag
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'påtatt' && { backgroundColor: Colors[colorScheme].tint }]}
            onPress={() => setActiveTab('påtatt')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'påtatt' ? '#FFFFFF' : Colors[colorScheme].textMuted }]}>
              Påtatte oppdrag
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={currentJobs}
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
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme].tint]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="inbox" size={60} color={Colors[colorScheme].textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyStateText, { color: Colors[colorScheme].textMuted }]}>
              {activeTab === 'mine' 
                ? 'Du har ikke lagt ut noen oppdrag ennå'
                : 'Du har ikke tatt på deg noen oppdrag ennå'}
            </Text>
            <TouchableOpacity 
              style={[styles.emptyStateButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={() => router.push('/(tabs)/ny-jobb')}
            >
              <Text style={styles.emptyStateButtonText}>
                {activeTab === 'mine' ? 'Legg ut oppdrag' : 'Finn oppdrag'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});