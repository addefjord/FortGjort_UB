import { FontAwesome as FA, FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';
import { database } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../types/database';

export default function ChatScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [otherName, setOtherName] = useState<string>('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<any>(null);
  const { loadMessages } = useData();

  const load = async () => {
    if (!user?.id || !otherUserId) return;
    try {
      setLoading(true);
      const data = await database.messages.getConversation(user.id, otherUserId);
      setMessages(data);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
      // Mark any unread messages addressed to the current user as read
      const unread = data.filter(m => m.receiver_id === user.id && !m.read);
      if (unread.length) {
        // Fire-and-forget updates to mark as read
        unread.forEach(m => database.messages.markAsRead(m.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!user?.id || !otherUserId || (!text.trim() && !selectedImage) || sending) return;
    try {
      setSending(true);

      // For now, store the local image URI directly
      // In production, you'd upload to Supabase storage first
      const msg = await database.messages.send({
        sender_id: user.id,
        receiver_id: otherUserId,
        content: text.trim() || '',
        image_url: selectedImage || undefined,
      });
      setText('');
      setSelectedImage(null);
      setMessages((prev) => [...prev, msg]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      // Refresh global inbox so message appears immediately there too
      loadMessages();
    } catch (error) {
      console.error('Send message failed:', error);
      Alert.alert('Feil', 'Kunne ikke sende meldingen');
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!user?.id || !otherUserId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Broadcast typing:true (simplified - just update state locally for now)
    setOtherTyping(false);
    
    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 2000);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tillatelse nødvendig', 'Vi trenger tilgang til bildebiblioteket for å sende bilder');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    load();
  }, [user?.id, otherUserId]);

  useEffect(() => {
    const run = async () => {
      if (!otherUserId) return;
      try {
        const p = await database.profiles.get(otherUserId);
        setOtherName(p?.name || 'Chat');
      } catch {
        setOtherName('Chat');
      }
    };
    run();
  }, [otherUserId]);

  useEffect(() => {
    if (!user?.id || !otherUserId) return;
    const channel = supabase
      .channel(`chat:${user.id}:${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        const match =
          (m.sender_id === user.id && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === user.id);
        if (match) setMessages((prev) => [...prev, m]);
          // If the incoming message is addressed to me, mark it read immediately
          if (match && m.receiver_id === user.id && !m.read) {
            database.messages.markAsRead(m.id);
          }
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, otherUserId]);

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.sender_id === user?.id;
    const timestamp = format(new Date(item.created_at), 'HH:mm', { locale: nb });
    const handleLongPress = () => {
      if (!mine) return; // only allow deleting own messages
      Alert.alert('Slett melding', 'Er du sikker på at du vil slette denne meldingen?', [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            // Optimistic removal
            setMessages(prev => prev.filter(m => m.id !== item.id));
            try {
              await database.messages.delete(item.id);
            } catch (e) {
              console.error('Delete failed:', e);
              Alert.alert('Feil', 'Kunne ikke slette meldingen');
              // Reload to restore state if deletion failed
              load();
            }
          }
        }
      ]);
    };
    return (
      <TouchableOpacity activeOpacity={0.85} onLongPress={handleLongPress} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {item.image_url && (
          <TouchableOpacity onPress={() => Alert.alert('Bilde', 'Full bildestørrelse kommer snart')}>
            <Image source={{ uri: item.image_url }} style={styles.messageImage} />
          </TouchableOpacity>
        )}
        {item.content ? (
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine, item.image_url && styles.bubbleTextWithImage]}>
            {item.content}
          </Text>
        ) : null}
        <View style={styles.bubbleFooter}>
          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{timestamp}</Text>
          {mine && (
            <View style={styles.readStatus}>
              <FA name="check" size={10} color={item.read ? Colors.light.tint : '#999'} style={{ marginLeft: -6 }} />
              <FA name="check" size={10} color={item.read ? Colors.light.tint : '#999'} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          <SafeAreaView edges={["top"]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                <FA name="chevron-left" size={18} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{otherName || 'Chat'}</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingTop: 8 }]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {otherTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{otherName} skriver...</Text>
            </View>
          )}

          <View style={styles.composer}>
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeSelectedImage}>
                  <FA name="times-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                <FontAwesome name="image" size={22} color={Colors.light.tint} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={handleTextChange}
                placeholder="Skriv en melding"
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity style={[styles.sendButton, ((!text.trim() && !selectedImage) || sending) && styles.sendDisabled]} onPress={send} disabled={(!text.trim() && !selectedImage) || sending}>
                <FontAwesome name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 90 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, backgroundColor: Colors.light.background },
  headerBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 4 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.light.tint },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#e9ecef' },
  bubbleText: { color: '#333', fontSize: 16 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextWithImage: { marginTop: 8 },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  bubbleTime: { fontSize: 11, color: '#666' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.8)' },
  readStatus: { flexDirection: 'row', alignItems: 'center' },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.light.background },
  typingText: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  composer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' },
  imagePreviewContainer: { marginBottom: 8, position: 'relative' },
  imagePreview: { width: 100, height: 100, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: Colors.light.error, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachButton: { padding: 8 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white' },
  sendButton: { marginLeft: 8, backgroundColor: Colors.light.tint, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sendDisabled: { opacity: 0.6 },
});
