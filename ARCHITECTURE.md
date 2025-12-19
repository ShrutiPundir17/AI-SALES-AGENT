# Architecture Documentation

## System Overview

The AI Sales Agent is a full-stack application designed to intelligently engage with potential customers, understand their needs, and guide them through the sales funnel. The system uses a hybrid approach combining rule-based logic and AI-powered responses.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  LeadForm    │  │ChatInterface │  │  LeadStats      │  │
│  │  Component   │→ │  Component   │→ │  Component      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                           ↓                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ REST API
                            ↓
┌───────────────────────────┼──────────────────────────────────┐
│                    Supabase Edge Function                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            /chat Endpoint Handler                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Intent    │  │   Response   │  │    Lead    │  │  │
│  │  │  Detection  │→ │  Generation  │→ │  Scoring   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ PostgreSQL
                            ↓
┌───────────────────────────┼──────────────────────────────────┐
│                    Supabase Database                         │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  leads  │  │conversations │  │  lead_activities    │    │
│  └─────────┘  └──────────────┘  └─────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────┼──────────────────────────────────┐
│                      OpenAI API (Optional)                   │
│              GPT-4-mini for Intent & Response                │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Layer

#### 1. LeadForm Component
**Responsibility**: Capture lead information before starting a conversation

**Key Features**:
- Form validation (name and email required)
- Input field icons for better UX
- Gradient design with smooth animations
- Privacy notice for trust building

**State Management**:
```typescript
const [formData, setFormData] = useState<LeadInfo>({
  name: '',
  email: '',
  phone: '',
  company: '',
});
```

**Design Decisions**:
- Minimal required fields (name, email) to reduce friction
- Optional fields (phone, company) for additional qualification
- Immediate validation on submit

#### 2. ChatInterface Component
**Responsibility**: Main conversation UI with message handling

**Key Features**:
- Real-time message display with auto-scroll
- Loading states with animated indicators
- Quick action buttons for common questions
- Lead statistics header
- Message sending with error handling

**State Management**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [inputMessage, setInputMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [lead, setLead] = useState<Lead | null>(null);
```

**Data Flow**:
1. User types message
2. Message added to local state (optimistic update)
3. API call to edge function
4. Agent response received
5. UI updated with response and new lead score

#### 3. MessageBubble Component
**Responsibility**: Display individual messages with appropriate styling

**Key Features**:
- Different styling for user vs agent messages
- Intent badges on agent messages
- Confidence score display
- Timestamp formatting
- Smooth fade-in animations

**Design Decisions**:
- Agent messages on left with blue gradient avatar
- User messages on right with gray gradient avatar
- Maximum width of 75% for better readability
- Intent information only shown on agent messages

#### 4. LeadStats Component
**Responsibility**: Visualize lead engagement metrics

**Key Features**:
- Real-time score updates
- Status icons (Flame, Thermometer, Snowflake)
- Progress bar with gradient
- Message count tracking
- Color-coded status indicators

**Scoring Visualization**:
```typescript
Hot (70-100):    Orange/Red gradient
Warm (40-69):    Yellow/Orange gradient
Cold (0-39):     Blue gradient
Not Interested:  Gray gradient
```

### Backend Layer

#### Edge Function Architecture

**File**: `supabase/functions/chat/index.ts`

**Request Flow**:
```
1. Receive POST request
2. Validate input (lead_id, message)
3. Fetch or create lead record
4. Load conversation history (last 5 messages)
5. Detect intent (OpenAI or rule-based)
6. Generate response
7. Calculate new lead score
8. Update database (conversations, leads, activities)
9. Return structured response
```

**Intent Detection Strategy**:

**Primary Method: OpenAI GPT-4**
```typescript
- Model: gpt-4o-mini (cost-effective)
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 300 (concise responses)
- Context: Last 5 messages + lead info
- Guardrails: System prompt with guidelines
```

**Fallback Method: Rule-Based**
```typescript
- Keyword matching algorithm
- Intent-specific keyword lists
- Confidence scoring based on matches
- Predefined response templates
```

**Why Hybrid Approach?**
1. **Reliability**: Works without external API dependency
2. **Cost-Effective**: Rule-based for simple queries
3. **Flexibility**: OpenAI for complex nuanced conversations
4. **Performance**: Rule-based is faster for straightforward intents

#### Intent Detection Algorithm

**Rule-Based Implementation**:
```typescript
function detectIntentRuleBased(message: string): IntentResult {
  // Normalize message
  const lowerMessage = message.toLowerCase();

  // Define intent patterns
  const intents = [
    {
      intent: 'pricing_inquiry',
      keywords: ['price', 'cost', 'how much', 'expensive', ...],
    },
    // ... other intents
  ];

  // Match keywords
  for (const intentObj of intents) {
    const matches = intentObj.keywords.filter(kw =>
      lowerMessage.includes(kw)
    );

    if (matches.length > 0) {
      // Calculate confidence
      const confidence = Math.min(0.95, matches.length * 0.3 + 0.5);

      // Return highest confidence match
      if (confidence > maxConfidence) {
        detectedIntent = intentObj.intent;
        maxConfidence = confidence;
      }
    }
  }

  return { intent: detectedIntent, confidence, keywords };
}
```

**Confidence Scoring**:
- Base confidence: 0.5
- +0.3 per keyword match
- Maximum confidence: 0.95 (rule-based can't be 100% certain)
- Minimum confidence: 0.6 (general_inquiry fallback)

#### Lead Scoring Algorithm

**Formula**:
```typescript
Base Score = Previous Score

Intent Score Additions:
- Pricing Inquiry:     +15 points
- Demo Request:        +25 points (highest value action)
- Feature Inquiry:     +10 points
- Follow-up Request:   +20 points (strong buying signal)
- Not Interested:      -30 points (disqualification)
- General Inquiry:     +5 points

Engagement Score:
- +3 points per message (max +20 from engagement)

Final Score = clamp(Base + Intent + Engagement, 0, 100)
```

**Status Determination**:
```typescript
function determineLeadStatus(score: number, intent: string): string {
  if (intent === 'not_interested') return 'not_interested';
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
```

**Why This Scoring?**
1. **Demo Request** weighted highest (clear buying intent)
2. **Follow-up Request** high value (explicit interest in next step)
3. **Pricing Inquiry** moderate value (research phase)
4. **Feature Inquiry** lower value (early exploration)
5. **Not Interested** strong negative (disqualifies lead)
6. **Engagement** rewards continued conversation

### Database Layer

#### Schema Design Philosophy

**Normalization Level**: Third Normal Form (3NF)

**Tables**:

1. **leads** (Primary entity)
   - Stores lead demographics and engagement metrics
   - Indexed on email for uniqueness
   - Indexed on lead_status for filtering
   - Trigger for auto-updating `updated_at`

2. **conversations** (Transaction records)
   - One-to-many relationship with leads
   - Stores all messages chronologically
   - Indexed on lead_id for fast retrieval
   - Indexed on created_at for time-based queries

3. **lead_activities** (Event log)
   - Tracks significant events for analytics
   - JSONB details for flexible data
   - Useful for future reporting/analytics

#### Row Level Security (RLS)

**Current Setup**: Public access (demo purposes)
```sql
CREATE POLICY "Allow public read/write" ON table_name
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

**Production Recommendation**:
```sql
-- Authenticated users only
CREATE POLICY "Users access own leads" ON leads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sales team access
CREATE POLICY "Sales team access all leads" ON leads
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'sales_rep'
    )
  );
```

#### Indexes Strategy

**Performance Optimizations**:
```sql
-- Conversation lookup by lead
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);

-- Recent conversations
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Lead activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);

-- Lead email uniqueness
CREATE INDEX idx_leads_email ON leads(email);

-- Lead status filtering
CREATE INDEX idx_leads_lead_status ON leads(lead_status);
```

**Why These Indexes?**
1. Lead ID lookups are most frequent (every message)
2. Time-based ordering for conversation history
3. Email lookups for lead creation/deduplication
4. Status filtering for sales dashboard queries

## Data Flow Diagrams

### Message Send Flow

```
User Types Message
      ↓
Optimistic UI Update (add to messages array)
      ↓
POST /functions/v1/chat
      ↓
Edge Function Handler
      ↓
Validate Input (lead_id, message)
      ↓
Fetch Lead from Database
      ├─ Exists → Continue
      └─ Not Exists → Create with lead_info
      ↓
Fetch Last 5 Messages (conversation context)
      ↓
Detect Intent
      ├─ OpenAI Available → GPT-4 Analysis
      └─ No OpenAI → Rule-Based Detection
      ↓
Generate Response
      ├─ OpenAI → Contextual AI Response
      └─ Rule-Based → Template Response
      ↓
Calculate Lead Score (intent + engagement)
      ↓
Determine Lead Status (hot/warm/cold)
      ↓
Database Updates (atomic transaction)
      ├─ Insert user message to conversations
      ├─ Insert agent message to conversations
      ├─ Update lead score and status
      └─ Insert activity log
      ↓
Return Response {reply, intent, confidence, next_action, lead_score, lead_status}
      ↓
Frontend Receives Response
      ↓
Update UI
      ├─ Add agent message to chat
      ├─ Update lead score display
      └─ Update lead status indicator
```

### Lead Creation Flow

```
User Fills Form (name, email, phone, company)
      ↓
Submit Form
      ↓
Generate UUID for lead_id (client-side)
      ↓
Store lead_info in state
      ↓
Navigate to ChatInterface
      ↓
Auto-send Initial Greeting
      ↓
First API Call includes lead_info
      ↓
Edge Function Creates Lead Record
      ↓
Subsequent Messages Use Existing Lead
```

## Technology Choices & Rationale

### Frontend Stack

**React 18**
- Modern hooks API for clean state management
- Virtual DOM for efficient updates
- Large ecosystem and community support

**TypeScript**
- Type safety reduces bugs
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring

**Tailwind CSS**
- Utility-first approach for rapid development
- Consistent design system
- Small production bundle (tree-shaken)
- No CSS naming conflicts

**Lucide React**
- Lightweight icon library
- Consistent icon style
- Tree-shakeable (only import used icons)
- React-optimized components

### Backend Stack

**Supabase Edge Functions**
- Serverless deployment (no infrastructure management)
- Built on Deno (modern, secure JavaScript runtime)
- Automatic scaling
- Integrated with Supabase ecosystem

**Deno Runtime**
- Secure by default (no file, network access without permission)
- Native TypeScript support
- Modern standard library
- Fast cold starts

**PostgreSQL (Supabase)**
- ACID compliance for data integrity
- Rich querying capabilities
- JSON support for flexible data
- Row Level Security for multi-tenancy

### AI Integration

**OpenAI GPT-4-mini**
- Cost-effective ($0.15/1M input tokens)
- Fast response times
- High-quality intent detection
- Context-aware responses

**Rule-Based Fallback**
- Zero-cost operation
- Predictable behavior
- Fast response times
- No external dependencies

## Security Considerations

### Current Implementation (Demo)

- Public RLS policies (anyone can read/write)
- Anonymous key authentication
- No user authentication required

### Production Recommendations

**Authentication**:
```typescript
// Use Supabase Auth
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// User sign-up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});

// Protected routes
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
```

**API Security**:
- Rate limiting (prevent abuse)
- Input sanitization (prevent SQL injection)
- CORS restrictions (whitelist domains)
- JWT validation (verify tokens)

**Data Protection**:
- Encrypt sensitive fields (PII)
- Audit logs for compliance
- Regular backups
- GDPR compliance (right to deletion)

## Performance Optimizations

### Frontend

**Code Splitting**:
```typescript
// Lazy load components
const ChatInterface = lazy(() => import('./components/ChatInterface'));
```

**Memoization**:
```typescript
// Prevent unnecessary re-renders
const MessageBubble = memo(({ message }) => {
  // Component logic
});
```

**Debouncing**:
```typescript
// Debounce input for better UX
const debouncedSend = useMemo(
  () => debounce(sendMessage, 300),
  []
);
```

### Backend

**Database Query Optimization**:
```sql
-- Use indexes effectively
SELECT * FROM conversations
WHERE lead_id = $1
ORDER BY created_at DESC
LIMIT 5;
-- Uses idx_conversations_lead_id
```

**Caching Strategy** (Future):
```typescript
// Cache frequent queries
const cachedLeadData = await redis.get(`lead:${leadId}`);
if (cachedLeadData) return JSON.parse(cachedLeadData);
```

## Monitoring & Observability

### Metrics to Track

**Business Metrics**:
- Conversion rate (cold → warm → hot)
- Average lead score
- Intent distribution
- Response time
- Message volume

**Technical Metrics**:
- API response time
- Database query performance
- Edge function cold starts
- Error rate
- OpenAI API latency

### Logging Strategy

```typescript
// Structured logging
console.log({
  timestamp: new Date().toISOString(),
  level: 'info',
  event: 'message_processed',
  lead_id: leadId,
  intent: detectedIntent,
  confidence: confidence,
  duration_ms: processingTime,
});
```

## Scalability Considerations

### Current Capacity
- Supabase free tier: 500MB database
- Edge functions: Auto-scaling (no limits)
- PostgreSQL: Connection pooling enabled

### Scaling Strategy

**Horizontal Scaling**:
- Edge functions scale automatically
- Add read replicas for database
- Implement caching layer (Redis)

**Vertical Scaling**:
- Upgrade Supabase plan for more connections
- Increase database resources
- Optimize queries with materialized views

## Future Enhancements

### Short-term (1-2 months)
1. **Webhook Support**: Notify external systems of lead events
2. **Email Integration**: Send follow-up emails automatically
3. **Analytics Dashboard**: Visualize lead metrics
4. **A/B Testing**: Test different conversation flows

### Medium-term (3-6 months)
1. **Multi-language Support**: Internationalization
2. **Voice Integration**: Text-to-speech and speech-to-text
3. **Sentiment Analysis**: Detect emotional tone
4. **CRM Integration**: Sync with Salesforce, HubSpot

### Long-term (6-12 months)
1. **Custom Training**: Fine-tune on company data
2. **Predictive Analytics**: ML for conversion prediction
3. **Calendar Integration**: Auto-schedule demos
4. **Advanced Routing**: Route to specific sales reps

## Conclusion

This architecture balances simplicity with scalability, providing a solid foundation for an AI-powered sales agent. The hybrid approach (AI + rule-based) ensures reliability, while the modern tech stack enables rapid iteration and deployment.

Key strengths:
- **Reliable**: Works with or without AI
- **Scalable**: Serverless architecture
- **Maintainable**: Clean code organization
- **Secure**: RLS-ready for production
- **Fast**: Optimized queries and caching-ready

The system is production-ready with proper environment configuration and can handle increasing loads with minimal modifications.
