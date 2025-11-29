import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { BlurView } from 'expo-blur';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/use-color-scheme';
import { formatLocation } from '../lib/format-location';
import { Job } from '../types/database';
import { Text } from './themed-text';

type JobCardProps = {
  job: Job;
  onPress: (job: Job) => void;
};

export function JobCard({ job, onPress }: JobCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(job)}>
      <BlurView 
        intensity={100} 
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.blurContainer}
      >
        {/* FINN-style horizontal layout */}
        <View style={styles.cardContent}>
          {/* Image section - left side */}
          <View style={[styles.imageWrapper, { backgroundColor: themeColors.background }]}>
            {job.images && job.images.length > 0 ? (
              <Image source={{ uri: job.images[0] }} style={styles.imageReal} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.background }]}>
                <FontAwesome name="image" size={32} color={themeColors.textMuted} />
              </View>
            )}
            {/* Status badge */}
            {job.status !== 'open' && (
              <View style={[styles.statusBadge,
                job.status === 'in_progress' && styles.inProgressBadge,
                job.status === 'completed' && styles.completedBadge,
                job.status === 'cancelled' && styles.cancelledBadge,
              ]}>
                <Text style={styles.statusText}>
                  {job.status === 'in_progress' ? 'Pågår' :
                    job.status === 'completed' ? 'Fullført' :
                    job.status === 'cancelled' ? 'Avbrutt' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Info section - right side */}
          <View style={styles.infoSection}>
            <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>{job.title}</Text>
            <Text style={[styles.price, { color: themeColors.text }]}>{job.price} kr</Text>
            <Text style={[styles.location, { color: themeColors.textMuted }]} numberOfLines={1}>{formatLocation(job.location)}</Text>
            <Text style={[styles.time, { color: themeColors.textMuted }]}>
              {job.created_at && !isNaN(Date.parse(job.created_at))
                ? formatDistanceToNow(new Date(job.created_at), { locale: nb, addSuffix: true })
                : ''}
            </Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(200, 200, 200, 0.3)',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'column',
    padding: 0,
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 10.5,
    borderTopRightRadius: 10.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageReal: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
  },
  inProgressBadge: {
    backgroundColor: '#FFB74D',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  cancelledBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
  },
});