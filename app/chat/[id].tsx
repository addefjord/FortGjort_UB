import { FontAwesome as FA, FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, KeyboardAvoidingView, Linking, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/themed-text';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../lib/auth-context';
import { useData } from '../../lib/data-context';
import { database } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../types/database';

// Animated wrapper for a single message bubble
function MessageBubble({ item, mine, timestamp, onDelete, styles, theme }: { item: Message; mine: boolean; timestamp: string; onDelete: () => void; styles: ReturnType<typeof getStyles>; theme: typeof Colors.light }) {
  const fadeAnim = useRef(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim.current, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLongPress = () => {
    if (!mine) return;
    Alert.alert('Slett melding', 'Er du sikker på at du vil slette denne meldingen?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim.current,
        transform: [{ translateY: slideAnim.current }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={handleLongPress}
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {item.image_url && (
          <TouchableOpacity onPress={() => Alert.alert('Bilde', 'Full bildestørrelse kommer snart')}>
            <Image source={{ uri: item.image_url }} style={styles.messageImage} />
          </TouchableOpacity>
        )}
        {item.content ? (
          <ParsedMessage
            text={item.content}
            style={[
              styles.bubbleText,
              mine && styles.bubbleTextMine,
              item.image_url && styles.bubbleTextWithImage,
            ]}
            linkColor={mine ? '#fff' : theme.tint}
          />
        ) : null}
        <View style={styles.bubbleFooter}>
          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{timestamp}</Text>
          {mine && (
            <View style={styles.readStatus}>
              <FA
                name="check"
                size={10}
                color={item.read ? Colors.light.tint : '#999'}
                style={{ marginLeft: -6 }}
              />
              <FA
                name="check"
                size={10}
                color={item.read ? Colors.light.tint : '#999'}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Simple URL parsing component for clickable links
function ParsedMessage({ text, style, linkColor }: { text: string; style: any; linkColor: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: Array<{ content: string; isLink: boolean }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(urlRegex)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) parts.push({ content: text.slice(lastIndex, match.index), isLink: false });
    parts.push({ content: match[0], isLink: true });
    lastIndex = (match.index + match[0].length);
  }
  if (lastIndex < text.length) parts.push({ content: text.slice(lastIndex), isLink: false });
  return (
    <Text style={style}>
      {parts.map((p, i) => p.isLink ? (
        <Text key={i} style={[style, { color: linkColor, textDecorationLine: 'underline' }]} onPress={() => Linking.openURL(p.content)}>
          {p.content}
        </Text>
      ) : (
        <Text key={i} style={style}>{p.content}</Text>
      ))}
    </Text>
  );
}

// Real-time chat screen with message history, typing indicators, and image support
export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = getStyles(theme, colorScheme);
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
      
      // Debug: Check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check:', { hasSession: !!session, userId: user.id });
      
      if (!session) {
        Alert.alert('Sesjon utløpt', 'Vennligst logg inn på nytt.');
        setSending(false);
        return;
      }

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
    } catch (error: any) {
      console.error('Send message failed:', error);
      const errorMsg = error?.message || 'Kunne ikke sende meldingen';
      Alert.alert('Feil', errorMsg);
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

    return (
      <MessageBubble
        item={item}
        mine={mine}
        timestamp={timestamp}
        onDelete={async () => {
          setMessages(prev => prev.filter(m => m.id !== item.id));
          try {
            await database.messages.delete(item.id);
          } catch (e) {
            console.error('Delete failed:', e);
            Alert.alert('Feil', 'Kunne ikke slette meldingen');
            load();
          }
        }}
        styles={styles}
        theme={theme}
      />
    );
  };

  // Build unified list with date separators
  const unified: Array<{ type: 'date' | 'message'; id: string; date?: string; message?: Message }> = [];
  let lastDate: string | null = null;
  for (const m of messages) {
    const dKey = format(new Date(m.created_at), 'yyyy-MM-dd');
    if (dKey !== lastDate) {
      lastDate = dKey;
      unified.push({ type: 'date', id: `date-${dKey}`, date: dKey });
    }
    unified.push({ type: 'message', id: m.id, message: m });
  }

  const renderUnified = ({ item }: { item: any }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparatorLine} />
          <Text style={[styles.dateSeparatorText, { color: theme.textMuted }]}>{format(new Date(item.date), 'd MMM yyyy', { locale: nb })}</Text>
          <View style={styles.dateSeparatorLine} />
        </View>
      );
    }
    return renderItem({ item: item.message });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          <SafeAreaView edges={["top"]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                <FA name="chevron-left" size={18} color={theme.tint} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{otherName || 'Chat'}</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <FA name="user" size={40} color={theme.textMuted} />
            </View>
            <Text style={[styles.profileName, { color: theme.text }]}>{otherName || 'Bruker'}</Text>
            <Text style={[styles.profileMeta, { color: theme.textMuted }]}>Verifisert • Siden 2023</Text>
          </View>
          <FlatList
            ref={listRef}
            data={unified}
            keyExtractor={(item) => item.id}
            renderItem={renderUnified}
            contentContainerStyle={[styles.listContent, { paddingTop: 8 }]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {otherTyping && (
            <View style={styles.typingIndicator}>
              <Text style={[styles.typingText, { color: theme.textMuted }]}>{otherName} skriver...</Text>
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
                <FontAwesome name="image" size={22} color={theme.tint} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={handleTextChange}
                placeholder="Skriv en melding"
                placeholderTextColor={theme.textMuted}
                multiline
              />
              <TouchableOpacity style={[styles.sendButton, ((!text.trim() && !selectedImage) || sending) && styles.sendDisabled]} onPress={send} disabled={(!text.trim() && !selectedImage) || sending}>
                <FontAwesome name="send" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
function getStyles(theme: typeof Colors.light, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 90 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 10,
      backgroundColor: theme.background,
    },
    headerBack: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    profileSection: { alignItems: 'center', paddingVertical: 12, gap: 6 },
    profileAvatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: scheme === 'dark' ? theme.cardElevated : theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    profileName: { fontSize: 18, fontWeight: '600' },
    profileMeta: { fontSize: 12 },
    dateSeparatorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12, gap: 8 },
    dateSeparatorLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dateSeparatorText: { fontSize: 12 },
    bubble: {
      maxWidth: '75%',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: theme.tint,
    },
    bubbleTheirs: {
      alignSelf: 'flex-start',
      backgroundColor: scheme === 'dark' ? theme.card : theme.card,
    },
    bubbleText: { color: theme.text, fontSize: 16, lineHeight: 22 },
    bubbleTextMine: { color: '#fff' },
    bubbleTextWithImage: { marginTop: 8 },
    messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
    bubbleFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    bubbleTime: { fontSize: 11, color: theme.textMuted },
    bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
    readStatus: { flexDirection: 'row', alignItems: 'center' },
    typingIndicator: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.background },
    typingText: { fontSize: 13, fontStyle: 'italic' },
    composer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 12,
      backgroundColor: scheme === 'dark' ? theme.card : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    imagePreviewContainer: { marginBottom: 8, position: 'relative' },
    imagePreview: { width: 100, height: 100, borderRadius: 8 },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: theme.error,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    attachButton: { padding: 8 },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.input,
      fontSize: 16,
      color: theme.text,
    },
    sendButton: {
      marginLeft: 8,
      backgroundColor: theme.tint,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
    },
    sendDisabled: { opacity: 0.5 },
  });
}
