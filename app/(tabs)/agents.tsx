import React, { useState, useRef, useEffect } from 'react';
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
import { analytics, EVENTS } from '../../src/lib/analytics';

// Agent colors by index for consistent styling
const AGENT_COLORS = [
  '#2D5F3F', '#3A7D53', '#4A8B5E', '#8B6E4E', '#C49A3F',
  '#5C4A35', '#6B6558', '#2D2A23', '#A09A8C',
];

type AgentInfo = {
  name: string;
  label: string;
  role: string;
  color: string;
  emoji?: string;
  status: string;
  currentTask?: string;
};

function AgentList({ onSelect }: { onSelect: (agent: AgentInfo) => void }) {
  const conversations = useQuery(api.agentMessages.listConversations);
  const registeredAgents = useQuery(api.agents.list);

  // Build agent list from Convex (dynamic)
  const agents: AgentInfo[] = (registeredAgents ?? []).map((a, i) => ({
    name: a.agentId,
    label: a.name,
    role: a.role || a.codename,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
    emoji: a.emoji,
    status: a.status,
    currentTask: a.currentTask,
  }));

  if (!registeredAgents) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Agents</Text>
        <Text style={styles.loadingText}>Loading agents...</Text>
      </View>
    );
  }

  if (agents.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Agents</Text>
        <Text style={styles.loadingText}>No agents registered yet. Sync from OpenClaw to populate.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agents</Text>
      {agents.map((agent) => {
        const conv = conversations?.find((c) => c.agentName === agent.name);
        return (
          <Pressable
            key={agent.name}
            style={styles.agentRow}
            onPress={() => onSelect(agent)}
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
                {agent.status === 'active' && (
                  <Circle size={8} fill="#3A7D53" color="#3A7D53" />
                )}
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {agent.currentTask
                  ? agent.currentTask
                  : conv?.lastMessage ?? 'No messages yet'}
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
  agent,
  onBack,
}: {
  agent: AgentInfo;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const agentName = agent.name;
  const messages = useQuery(api.agentMessages.listByAgent, { agentName });
  const sendMessage = useMutation(api.agentMessages.send);
  const markRead = useMutation(api.agentMessages.markRead);
  const flatListRef = useRef<FlatList>(null);

  const prevCountRef = useRef(messages?.length ?? 0);
  useEffect(() => {
    markRead({ agentName });
    const currentCount = messages?.length ?? 0;
    if (currentCount > prevCountRef.current && messages) {
      const latest = messages[messages.length - 1];
      if (latest?.direction === 'inbound') {
        analytics.capture(EVENTS.AGENT_MESSAGE_RECEIVED, { agentId: agentName });
      }
    }
    prevCountRef.current = currentCount;
  }, [agentName, messages?.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    await sendMessage({ agentName, content: msg });
    analytics.capture(EVENTS.AGENT_MESSAGE_SENT, { agentId: agentName });
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
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  if (selectedAgent) {
    return (
      <ChatView
        agent={selectedAgent}
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
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#A09A8C',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
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
