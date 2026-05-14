import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ridesAPI } from '../../api/rides';

export default function ChatModal({ visible, onClose, bookingId, driverName, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && bookingId) {
      loadMessages();
    }
  }, [visible, bookingId]);

  // Listen for new incoming messages from parent (WebSocket)
  useEffect(() => {
    if (onNewMessage) {
      // Parent will call this when WS message arrives
    }
  }, [onNewMessage]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await ridesAPI.getMessages(bookingId);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  };

  // Called from parent when WebSocket message arrives
  const addMessage = (msg) => {
    setMessages(prev => {
      if (prev.find(m => String(m.id) === String(msg.id))) return prev;
      
      // Prevent duplication of optimistic messages if WS arrives before API response
      if (msg.sender_type === 'user') {
        const tempIdx = prev.findIndex(m => String(m.id).startsWith('temp_') && m.message === msg.message);
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next;
        }
      }
      
      return [...prev, msg];
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Expose addMessage via ref pattern
  if (onNewMessage) {
    onNewMessage.current = addMessage;
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    // Optimistic add
    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender_type: 'user',
      message: msgText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await ridesAPI.sendMessage(bookingId, msgText);
      if (res.data.success) {
        setMessages(prev => {
          const newMsg = res.data.message;
          const filtered = prev.filter(m => m.id !== tempMsg.id);
          if (filtered.some(m => String(m.id) === String(newMsg.id))) {
            return filtered;
          }
          return [...filtered, newMsg];
        });
      }
    } catch (e) {
      // Remove failed temp message
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
    setSending(false);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_type === 'user';
    const time = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[st.msgRow, isMe && st.msgRowMe]}>
        <View style={[st.bubble, isMe ? st.bubbleMe : st.bubbleOther]}>
          <Text style={[st.bubbleText, isMe && st.bubbleTextMe]}>{item.message}</Text>
          <Text style={[st.bubbleTime, isMe && st.bubbleTimeMe]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView
          style={st.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={st.container}>
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={onClose} style={st.headerBack}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={st.headerInfo}>
              <View style={st.headerAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
              <View>
                <Text style={st.headerName}>{driverName || 'Captain'}</Text>
                <Text style={st.headerSub}>In-ride chat</Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          {loading ? (
            <View style={st.loadingWrap}><ActivityIndicator color={COLORS.primary} /></View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={st.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={st.emptyWrap}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.border} />
                  <Text style={st.emptyText}>No messages yet</Text>
                  <Text style={st.emptySubtext}>Send a message to your captain</Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <View style={st.inputBar}>
            <TextInput
              style={st.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textLight}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[st.sendBtn, !text.trim() && st.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' },
  headerBack: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  headerName: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.textSecondary },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: SIZES.md, color: COLORS.text, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: COLORS.textLight, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: '#ffffffAA' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border + '50', paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: SIZES.md, maxHeight: 100, color: COLORS.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
});
