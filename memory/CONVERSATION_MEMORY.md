# Conversation Memory

> Chat history and context storage for multi-turn conversations.
> Append-only design with automatic summarization.

---

## Purpose

Conversation memory stores:
- Complete chat history
- Context across turns
- User preferences expressed in chat
- Decision points and outcomes
- Conversation summaries

---

## Data Schema

### Conversation

```typescript
interface Conversation {
  conversation_id: string;
  user_id: string;
  session_id: string;
  created_at: number;
  updated_at: number;
  
  // Messages
  messages: Message[];
  
  // Context
  context: ConversationContext;
  
  // Summary
  summary?: ConversationSummary;
  
  // Metadata
  metadata: {
    message_count: number;
    total_tokens: number;
    language: string;
    status: 'active' | 'archived';
  };
}
```

**Key Pattern**: `conv:{conversation_id}`
**TTL**: 7 days
**Size**: ~5KB per 100 messages

---

### Message

```typescript
interface Message {
  message_id: string;
  timestamp: number;
  
  // Content
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  
  // Metadata
  metadata: {
    tokens: number;
    model?: string;
    latency_ms?: number;
    agent_id?: string;
  };
  
  // Attachments
  attachments?: {
    type: 'image' | 'file' | 'data';
    url?: string;
    data?: any;
  }[];
  
  // Context
  context?: {
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
  };
}
```

**Key Pattern**: `conv:{conversation_id}:msg:{message_id}`
**TTL**: 7 days (follows conversation)
**Size**: ~500 bytes per message

---

### Conversation Context

```typescript
interface ConversationContext {
  // Current topic
  topic: {
    primary: string;
    secondary?: string;
    confidence: number;
  };
  
  // Extracted entities
  entities: {
    destination?: string;
    dates?: { start: string; end: string };
    travelers?: number;
    budget?: number;
    preferences?: Record<string, any>;
  };
  
  // Intent history
  intents: {
    intent: string;
    timestamp: number;
    fulfilled: boolean;
  }[];
  
  // Decision points
  decisions: {
    question: string;
    options: string[];
    chosen: string;
    timestamp: number;
  }[];
}
```

**Key Pattern**: `conv:{conversation_id}:context`
**TTL**: 7 days
**Size**: ~2KB

---

### Conversation Summary

```typescript
interface ConversationSummary {
  generated_at: number;
  
  // Summary content
  summary: string;
  
  // Key points
  key_points: string[];
  
  // Decisions made
  decisions: {
    question: string;
    answer: string;
  }[];
  
  // Next steps
  next_steps: string[];
  
  // Tokens saved
  tokens_saved: number;
}
```

**Key Pattern**: `conv:{conversation_id}:summary`
**TTL**: 7 days
**Size**: ~1KB

---

## Storage Architecture

### Redis Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   CONVERSATION MEMORY                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Conversation                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ conv:conv_abc123                                     │   │
│  │ {                                                   │   │
│  │   conversation_id: "conv_abc123",                   │   │
│  │   user_id: "user_456",                              │   │
│  │   messages: [...],                                  │   │
│  │   context: {...},                                   │   │
│  │   summary: {...},                                   │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Messages (sorted by timestamp)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ conv:conv_abc123:msg:msg_001                        │   │
│  │ conv:conv_abc123:msg:msg_002                        │   │
│  │ conv:conv_abc123:msg:msg_003                        │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Context                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ conv:conv_abc123:context                             │   │
│  │ {                                                   │   │
│  │   topic: { primary: "hotel_booking", ... },         │   │
│  │   entities: { destination: "Paris", ... },          │   │
│  │   intents: [...],                                   │   │
│  │   decisions: [...]                                  │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Access Patterns

### Message Operations

```typescript
// Add message to conversation
async function addMessage(
  conversationId: string,
  message: Message
): Promise<void> {
  // Store message
  await memory.set(
    `conv:${conversationId}:msg:${message.message_id}`,
    message,
    { ttl: 604800 }  // 7 days
  );
  
  // Append to message list
  await memory.append(
    `conv:${conversationId}:messages`,
    message.message_id
  );
  
  // Update conversation metadata
  await memory.transaction(async (tx) => {
    const conv = await tx.get(`conv:${conversationId}`);
    conv.metadata.message_count++;
    conv.metadata.total_tokens += message.metadata.tokens;
    conv.updated_at = Date.now();
    await tx.set(`conv:${conversationId}`, conv);
  });
}

// Get conversation messages
async function getMessages(
  conversationId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Message[]> {
  const messageIds = await memory.get(
    `conv:${conversationId}:messages`
  );
  
  const { limit = 50, offset = 0 } = options;
  const sliced = messageIds.slice(offset, offset + limit);
  
  return memory.mget(
    sliced.map(id => `conv:${conversationId}:msg:${id}`)
  );
}
```

### Context Operations

```typescript
// Update context
async function updateContext(
  conversationId: string,
  updates: Partial<ConversationContext>
): Promise<void> {
  await memory.transaction(async (tx) => {
    const context = await tx.get(`conv:${conversationId}:context`);
    Object.assign(context, updates);
    await tx.set(`conv:${conversationId}:context`, context);
  });
}

// Extract entities from message
async function extractEntities(
  conversationId: string,
  message: Message
): Promise<void> {
  const entities = await llm.extractEntities(message.content);
  
  await updateContext(conversationId, {
    entities: {
      ...entities,
      // Merge with existing
    }
  });
}
```

### Summary Operations

```typescript
// Generate summary
async function generateSummary(
  conversationId: string
): Promise<ConversationSummary> {
  const messages = await getMessages(conversationId, { limit: 100 });
  
  const summary = await llm.summarize(
    messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  );
  
  await memory.set(
    `conv:${conversationId}:summary`,
    summary,
    { ttl: 604800 }
  );
  
  return summary;
}

// Get context window
async function getContextWindow(
  conversationId: string,
  maxTokens: number = 4000
): Promise<Message[]> {
  const messages = await getMessages(conversationId);
  
  // Start from most recent
  let tokenCount = 0;
  const contextWindow: Message[] = [];
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    tokenCount += msg.metadata.tokens;
    
    if (tokenCount > maxTokens) break;
    
    contextWindow.unshift(msg);
  }
  
  // Include summary if available
  const summary = await memory.get(
    `conv:${conversationId}:summary`
  );
  
  if (summary && tokenCount < maxTokens) {
    contextWindow.unshift({
      role: 'system',
      content: `Previous conversation summary:\n${summary.summary}`,
      message_id: 'summary',
      timestamp: summary.generated_at,
      metadata: { tokens: 500 }  // Estimate
    });
  }
  
  return contextWindow;
}
```

---

## Automatic Summarization

### Trigger Conditions

```typescript
interface SummarizationTrigger {
  message_count: number;    // Trigger after N messages
  token_count: number;      // Trigger after N tokens
  time_elapsed: number;     // Trigger after N seconds
  user_request: boolean;    // Trigger on user request
}

const DEFAULT_TRIGGERS: SummarizationTrigger = {
  message_count: 50,
  token_count: 10000,
  time_elapsed: 3600,      // 1 hour
  user_request: true
};
```

### Summarization Process

```typescript
async function checkAndSummarize(
  conversationId: string
): Promise<boolean> {
  const conv = await memory.get(`conv:${conversationId}`);
  const triggers = DEFAULT_TRIGGERS;
  
  const shouldSummarize =
    conv.metadata.message_count >= triggers.message_count ||
    conv.metadata.total_tokens >= triggers.token_count ||
    (Date.now() - conv.updated_at) >= triggers.time_elapsed;
  
  if (shouldSummarize && !conv.summary) {
    await generateSummary(conversationId);
    return true;
  }
  
  return false;
}
```

---

## Cleanup Strategy

### Message Cleanup

```typescript
async function cleanupOldMessages(
  conversationId: string,
  keepLast: number = 100
): Promise<number> {
  const messageIds = await memory.get(
    `conv:${conversationId}:messages`
  );
  
  if (messageIds.length <= keepLast) return 0;
  
  const toDelete = messageIds.slice(0, messageIds.length - keepLast);
  
  await memory.mdelete(
    toDelete.map(id => `conv:${conversationId}:msg:${id}`)
  );
  
  await memory.set(
    `conv:${conversationId}:messages`,
    messageIds.slice(keepLast)
  );
  
  return toDelete.length;
}
```

### Conversation Cleanup

```typescript
async function cleanupExpiredConversations(): Promise<number> {
  const pattern = 'conv:*';
  let cursor = 0;
  let cleaned = 0;
  
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) {
        // Expired, clean up all related keys
        await deleteConversationData(key);
        cleaned++;
      }
    }
  } while (cursor !== 0);
  
  return cleaned;
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `conv.active_conversations` | Active conversations |
| `conv.total_messages` | Total messages stored |
| `conv.avg_messages_per_conv` | Average messages per conversation |
| `conv.summaries_generated` | Summaries generated |
| `conv.tokens_saved` | Tokens saved via summarization |
| `conv.cleanup_count` | Cleaned up conversations |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Message Count | > 1000 messages in conversation | Warning |
| Large Conversation | > 1MB per conversation | Warning |
| Memory Usage | > 50% of allocated memory | Warning |
