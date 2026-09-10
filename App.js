import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App inaongea na Supabase edge function yetu, si DeepSeek moja kwa moja.
// Kwa njia hii API key haionekani kwenye APK hata kidogo.
const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL || '';
const CHAT_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = '@quanatara_chat_history';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Karibu Quanatara! 👋\n\nMimi ni AI assistant wa Quanatara. Tunatengeneza AI chatbots za customer support (ikiwemo WhatsApp) na business automation inayounganisha tools zako na kufuta kazi za mkono.\n\nUliza kitu kuhusu huduma zetu, au niambie tatizo unalokutana nalo kwa biashara yako.",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const listRef = useRef(null);
  const abortRef = useRef(null);

  // Load saved conversation once on start.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        // If storage fails we just start fresh — not worth blocking the user.
        console.warn('Could not load chat history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, []);

  // Persist the conversation whenever it changes (after the first load).
  useEffect(() => {
    if (!historyLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        console.warn('Could not save chat history:', err);
      }
    })();
  }, [messages, historyLoaded]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert('Anza upya', 'Futa mazungumzo yote na uanze tena?', [
      { text: 'Ghairi', style: 'cancel' },
      {
        text: 'Futa',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
          } catch (err) {
            console.warn('Could not clear history:', err);
          }
          setMessages([WELCOME_MESSAGE]);
          setStreamingText('');
        },
      },
    ]);
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!CHAT_API_URL || !CHAT_ANON_KEY) {
      Alert.alert(
        'Backend haipo',
        'Weka EXPO_PUBLIC_CHAT_API_URL na EXPO_PUBLIC_SUPABASE_ANON_KEY kwenye file la .env, kisha uanzishe app upya.'
      );
      return;
    }

    const userMessage = { id: uid(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');
    scrollToBottom();

    // Tunatuma conversation (bila ile greeting card) kwenye backend yetu.
    const apiMessages = nextMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CHAT_ANON_KEY}`,
          apikey: CHAT_ANON_KEY,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';

      if (reply) {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', content: reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: 'Samahani, sikuweza kupata jibu. Jaribu tena tafadhali.',
          },
        ]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Chat request failed:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content:
              'Kuna tatizo la kuunganisha kwenye server. Angalia mtandao wako kisha ujaribu tena.',
          },
        ]);
      }
    } finally {
      abortRef.current = null;
      setStreamingText('');
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, messages, scrollToBottom]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => {
      const isUser = item.role === 'user';
      return (
        <View
          style={[
            styles.bubbleRow,
            isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
              ]}
            >
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  const renderFooter = useCallback(() => {
    if (!streamingText && !loading) return null;
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
        <View style={[styles.bubble, styles.bubbleAssistant]}>
          {streamingText ? (
            <Text style={[styles.bubbleText, styles.bubbleTextAssistant]}>
              {streamingText}
            </Text>
          ) : (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color="#7C5CFF" />
              <Text style={styles.typingText}>inaandika…</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [streamingText, loading]);

  const canSend = input.trim().length > 0 && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B14" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Q</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Quanatara AI</Text>
              <Text style={styles.headerSubtitle}>
                {loading ? 'inaandika…' : 'Yupo mtandaoni'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Anza upya</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Andika ujumbe…"
            placeholderTextColor="#6B6B80"
            multiline
            maxLength={2000}
            editable={!loading}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          {loading ? (
            <TouchableOpacity style={styles.stopButton} onPress={stopGeneration}>
              <Text style={styles.stopButtonText}>■</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!canSend}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0B14',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
    backgroundColor: '#0F0F1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#8B8BA3',
    fontSize: 12,
    marginTop: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  clearButtonText: {
    color: '#A0A0B8',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#7C5CFF',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#191927',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#242438',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: '#E4E4F0',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: '#8B8BA3',
    fontSize: 13,
    marginLeft: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    backgroundColor: '#0F0F1A',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#191927',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#242438',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A3E',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
