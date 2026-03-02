import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Send, ArrowLeft, Circle } from 'lucide-react-native';

const AGENTS = [
  { name: 'adam', label: 'Adam', role: 'Manager', color: '#2D5F3F' },
  { name: 'tarek', label: 'Tarek', role: 'Builder', color: '#3A7D53' },
  { name: 'rami', label: 'Rami', role: 'Builder', color: '#4A8B5E' },
  { name: 'nadia', label: 'Nadia', role: 'QA', color: '#8B6E4E' },
  { name: 'youssef', label: 'Youssef', role: 'Analyst', color: '#C49A3F' },
];

function AgentList({ onSelect }: { onSelect: (name: string) => void }) {
  const conversations = useQuery(api.agentMessages.listConversations);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agents</Text>
      {AGENTS.map((agent) => {
        const conv = conversations?.find((c) => c.agentName === agent.name);
        return (
          <Pressable
            key={agent.name}
            style={styles.agentRow}
            onPress={() => onSelect(agent.name)}
          >
            <View style={[styles.avatar, { backgroundColor: agent.color }]}>
              <Text style={styles.avatarText}>
                {agent.label[0]}
              </Text>
            </View>
            <View style={styles.agentInfo}>
              <View style={styles.agentHeader}>
                <Text style={styles.agentName}>{agent.label}</Text>
                <Text style={styles.agentRole}>{agent.role}</Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conv?.lastMessage ?? 'No messages yet'}
              </Text>
            </View>
            {(conv?.unread ?? 0) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conv!.unread}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function ChatView({
  agentName,
  onBack,
}: {
  agentName: string;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const messages = useQuery(api.agentMessages.listByAgent, { agentName });
  const sendMessage = useMutation(api.agentMessages.send);
  const markRead = useMutation(api.agentMessages.markRead);
  const flatListRef = useRef<FlatList>(null);
  const agent = AGENTS.find((a) => a.name === agentName)!;

  React.useEffect(() => {
    markRead({ agentName });
  }, [agentName, messages?.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    await sendMessage({ agentName, content: msg });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#2D2A23" />
        </Pressable>
        <View style={[styles.avatarSmall, { backgroundColor: agent.color }]}>
          <Text style={styles.avatarTextSmall}>{agent.label[0]}</Text>
        </View>
        <View>
          <Text style={styles.chatName}>{agent.label}</Text>
          <Text style={styles.chatRole}>{agent.role}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages ?? []}
        keyExtractor={(item) => item._id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.direction === 'outbound'
                ? styles.outbound
                : styles.inbound,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.direction === 'outbound'
                  ? styles.outboundText
                  : styles.inboundText,
              ]}
            >
              {item.content}
            </Text>
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Send a message to {agent.label}
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder={`Message ${agent.label}...`}
          placeholderTextColor="#A09A8C"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Send size={20} color={text.trim() ? '#FFFFFF' : '#A09A8C'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AgentsScreen() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  if (selectedAgent) {
    return (
      <ChatView
        agentName={selectedAgent}
        onBack={() => setSelectedAgent(null)}
      />
    );
  }

  return <AgentList onSelect={setSelectedAgent} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5EB',
    paddingTop: 60,
  },
  title: {
    fontFamily: 'Fraunces-Bold',
    fontSize: 24,
    color: '#2D2A23',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD2',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  agentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: '#2D2A23',
  },
  agentRole: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#A09A8C',
  },
  lastMessage: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#6B6558',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#2D5F3F',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD2',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  chatName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: '#2D2A23',
  },
  chatRole: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#A09A8C',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  outbound: {
    alignSelf: 'flex-end',
    backgroundColor: '#2D5F3F',
    borderBottomRightRadius: 4,
  },
  inbound: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5DFD2',
  },
  messageText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 21,
  },
  outboundText: {
    color: '#FFFFFF',
  },
  inboundText: {
    color: '#2D2A23',
  },
  messageTime: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: '#A09A8C',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyChatText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#A09A8C',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5DFD2',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#2D2A23',
    backgroundColor: '#F0E9DA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D5F3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#E5DFD2',
  },
});
