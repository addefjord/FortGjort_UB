import { FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';

export default function MessagesPage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { messages, loadMessages, isLoading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [loadMessages]);

  // Group messages by other participant and pick the latest message per conversation
  const data = useMemo(() => {
    const map = new Map<string, typeof messages[number]>();
    for (const m of messages) {
      const otherId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
      const prev = map.get(otherId);
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
        map.set(otherId, m);
      }
    }
    // Sort by latest
    const latest = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return latest;
  }, [messages, user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Meldinger</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        initialNumToRender={5}
        windowSize={5}
        renderItem={({ item }) => {
          const isMine = item.sender_id === user?.id;
          const otherUserId = isMine ? item.receiver_id : item.sender_id;
          const name = (item as any)[isMine ? 'receiver' : 'sender']?.name || 'Bruker';
          const time = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: nb });
          // Count unread for this conversation (optional simple dot if >0)
          const unreadForThread = messages.filter(
            (m) => (m.sender_id === otherUserId || m.receiver_id === otherUserId) && m.receiver_id === user?.id && !m.read
          ).length;
          const isUnread = unreadForThread > 0;

          return (
            <TouchableOpacity
              style={[styles.messageCard, { backgroundColor: Colors[colorScheme].cardElevated }]}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: otherUserId } })}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: Colors[colorScheme].card }]}>
                  <FontAwesome name="user" size={24} color={Colors[colorScheme].textMuted} />
                </View>
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.senderName, { color: Colors[colorScheme].text }]}>{name}</Text>
                  <Text style={[styles.messageTime, { color: Colors[colorScheme].textMuted }]}>{time}</Text>
                </View>
                <Text style={[styles.messageText, { color: Colors[colorScheme].textMuted }, isUnread && { fontWeight: '600', color: Colors[colorScheme].text }]} numberOfLines={1}>
                  {item.content}
                </Text>
              </View>
              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: Colors[colorScheme].error }]}>
                  <Text style={styles.unreadBadgeText}>{Math.min(unreadForThread, 9)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading.messages}
            onRefresh={onRefresh}
            colors={[Colors[colorScheme].tint]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="comments-o" size={60} color={Colors[colorScheme].textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyStateText, { color: Colors[colorScheme].textMuted }]}>
              Du har ingen meldinger ennå
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 13,
  },
  messageText: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
  },
});