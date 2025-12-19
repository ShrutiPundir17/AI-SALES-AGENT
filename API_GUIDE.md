# API Guide - AI Sales Agent

This guide provides detailed information about the API endpoints, request/response formats, and integration examples.

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

All API requests require the Supabase anonymous key in the Authorization header:

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## Endpoints

### POST /chat

The main endpoint for sending messages and receiving AI-generated responses.

#### Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

#### Request Body

```typescript
{
  lead_id: string;           // UUID of the lead
  message: string;           // User's message
  lead_info?: {             // Optional, required for new leads
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }
}
```

#### Response

```typescript
{
  reply: string;            // AI-generated response
  intent: string;           // Detected intent
  confidence: number;       // Confidence score (0-1)
  next_action: string;      // Suggested next action
  lead_score: number;       // Updated lead score (0-100)
  lead_status: string;      // Updated lead status
}
```

#### Status Codes

- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Lead not found (when lead_info not provided)
- `500` - Internal Server Error

## Intent Types

The system can detect the following intents:

| Intent | Description | Example Messages |
|--------|-------------|------------------|
| `pricing_inquiry` | Questions about cost, pricing, or fees | "How much does it cost?", "What are your prices?" |
| `demo_request` | Request to see product demonstration | "Can I see a demo?", "Show me how it works" |
| `feature_inquiry` | Questions about features or capabilities | "What features do you have?", "Does it integrate with Slack?" |
| `follow_up` | Request for callback or meeting | "Can someone call me?", "Schedule a meeting" |
| `not_interested` | Expressing disinterest | "Not interested", "Maybe later" |
| `general_inquiry` | Other questions or statements | Any message not matching above |

## Next Actions

Based on detected intent, the system suggests these actions:

| Next Action | Description | Triggered By |
|-------------|-------------|--------------|
| `offer_demo` | Offer a product demonstration | pricing_inquiry |
| `schedule_demo` | Book a demo appointment | demo_request |
| `share_documentation` | Send feature documentation | feature_inquiry |
| `schedule_call` | Arrange a phone call | follow_up |
| `mark_cold` | Mark lead as cold | not_interested |
| `continue_conversation` | Continue engaging | general_inquiry |

## Lead Status Values

| Status | Score Range | Description |
|--------|------------|-------------|
| `hot` | 70-100 | Highly engaged, ready to convert |
| `warm` | 40-69 | Interested, needs nurturing |
| `cold` | 0-39 | Low engagement |
| `not_interested` | Any | Explicitly not interested |

## Complete Examples

### Example 1: New Lead - Pricing Inquiry

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "What are your pricing plans?",
    "lead_info": {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@techcorp.com",
      "phone": "+91 98765 43210",
      "company": "TechCorp Solutions"
    }
  }'
```

**Response:**
```json
{
  "reply": "Hi Sarah! Our pricing is flexible and starts from ₹999/month for the starter plan. We also have Pro (₹2,999/month) and Enterprise (custom pricing) plans. Would you like me to share a detailed pricing breakdown or schedule a demo?",
  "intent": "pricing_inquiry",
  "confidence": 0.92,
  "next_action": "offer_demo",
  "lead_score": 15,
  "lead_status": "cold"
}
```

### Example 2: Existing Lead - Demo Request

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Yes, I would like to schedule a demo"
  }'
```

**Response:**
```json
{
  "reply": "That's great, Sarah! I'd love to show you our product. We can schedule a personalized demo at your convenience. What day and time works best for you this week?",
  "intent": "demo_request",
  "confidence": 0.95,
  "next_action": "schedule_demo",
  "lead_score": 43,
  "lead_status": "warm"
}
```

### Example 3: Feature Inquiry

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Does your platform integrate with Salesforce?"
  }'
```

**Response:**
```json
{
  "reply": "Hi Sarah! Our platform includes powerful features like AI-powered analytics, real-time collaboration, automated workflows, and seamless integrations with 50+ tools including Salesforce. Which specific feature are you most interested in learning about?",
  "intent": "feature_inquiry",
  "confidence": 0.88,
  "next_action": "share_documentation",
  "lead_score": 56,
  "lead_status": "warm"
}
```

### Example 4: Follow-up Request

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Can someone from your team call me tomorrow?"
  }'
```

**Response:**
```json
{
  "reply": "Absolutely, Sarah! I'll have one of our sales representatives reach out to you shortly. Can you confirm the best number and time to reach you?",
  "intent": "follow_up",
  "confidence": 0.91,
  "next_action": "schedule_call",
  "lead_score": 79,
  "lead_status": "hot"
}
```

### Example 5: Not Interested

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Actually, I am not interested right now"
  }'
```

**Response:**
```json
{
  "reply": "No problem at all, Sarah! I understand timing isn't right. Feel free to reach out whenever you're ready. Have a great day!",
  "intent": "not_interested",
  "confidence": 0.94,
  "next_action": "mark_cold",
  "lead_score": 49,
  "lead_status": "not_interested"
}
```

## Error Responses

### Missing Required Fields

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response (400):**
```json
{
  "error": "lead_id and message are required"
}
```

### Lead Not Found

**Request:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "lead_id": "invalid-uuid",
    "message": "Hello"
  }'
```

**Response (404):**
```json
{
  "error": "Lead not found and insufficient lead_info provided"
}
```

## Integration Examples

### JavaScript/TypeScript

```typescript
const sendMessage = async (leadId: string, message: string) => {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/chat',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_id: leadId,
        message: message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

const result = await sendMessage(
  '550e8400-e29b-41d4-a716-446655440000',
  'Tell me about your pricing'
);

console.log(result.reply);
console.log(`Intent: ${result.intent} (${result.confidence})`);
console.log(`Lead Score: ${result.lead_score}`);
```

### Python

```python
import requests
import json

def send_message(lead_id: str, message: str) -> dict:
    url = "https://your-project.supabase.co/functions/v1/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    }
    payload = {
        "lead_id": lead_id,
        "message": message
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    return response.json()

result = send_message(
    "550e8400-e29b-41d4-a716-446655440000",
    "Tell me about your pricing"
)

print(result["reply"])
print(f"Intent: {result['intent']} ({result['confidence']})")
print(f"Lead Score: {result['lead_score']}")
```

### cURL with Environment Variables

```bash
#!/bin/bash

SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your_anon_key"
LEAD_ID="550e8400-e29b-41d4-a716-446655440000"
MESSAGE="What features do you offer?"

curl -X POST "${SUPABASE_URL}/functions/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d "{
    \"lead_id\": \"${LEAD_ID}\",
    \"message\": \"${MESSAGE}\"
  }"
```

## Rate Limiting

Currently, there are no rate limits enforced. However, it's recommended to:

- Implement client-side throttling
- Wait for response before sending next message
- Handle 429 status codes if rate limiting is added

## Best Practices

1. **Generate Unique Lead IDs**: Use UUID v4 for new leads
2. **Provide Lead Info**: Always include lead_info for first message
3. **Handle Errors Gracefully**: Implement retry logic with exponential backoff
4. **Store Conversation History**: Maintain local copy for better UX
5. **Validate Input**: Sanitize messages before sending
6. **Monitor Confidence**: Low confidence scores may need human intervention
7. **Act on Next Actions**: Use the suggested next_action field for workflow automation

## Webhooks (Future Feature)

Planned webhook support for real-time lead updates:

```json
{
  "event": "lead.status_changed",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "old_status": "warm",
  "new_status": "hot",
  "lead_score": 75,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Support

For API issues or questions:
- Check the main README.md for setup instructions
- Review error messages carefully
- Verify environment variables are set correctly
- Open an issue on GitHub for bugs

---

Happy integrating!
