import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  lead_id: string;
  message: string;
  lead_info?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

interface IntentResult {
  intent: string;
  confidence: number;
  keywords: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, message, lead_info }: ChatRequest = await req.json();

    if (!lead_id || !message) {
      return new Response(
        JSON.stringify({ error: 'lead_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let lead = null;
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .maybeSingle();

    if (existingLead) {
      lead = existingLead;
    } else if (lead_info && lead_info.email) {
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          id: lead_id,
          name: lead_info.name || 'Unknown',
          email: lead_info.email,
          phone: lead_info.phone,
          company: lead_info.company,
        })
        .select()
        .single();

      if (leadError) throw leadError;
      lead = newLead;
    } else {
      return new Response(
        JSON.stringify({ error: 'Lead not found and insufficient lead_info provided' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: recentMessages } = await supabase
      .from('conversations')
      .select('message, sender')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const conversationHistory = (recentMessages || []).reverse();

    let intentResult: IntentResult;
    let aiReply: string;
    let nextAction: string;

    if (openaiApiKey) {
      try {
        const result = await generateAIResponse(
          message,
          conversationHistory,
          lead,
          openaiApiKey
        );
        intentResult = result.intent;
        aiReply = result.reply;
        nextAction = result.nextAction;
      } catch (aiError) {
        console.error('OpenAI API error, falling back to rule-based:', aiError);
        // Fall back to rule-based if OpenAI fails
        intentResult = detectIntentRuleBased(message);
        aiReply = generateRuleBasedResponse(intentResult.intent, lead);
        nextAction = determineNextAction(intentResult.intent);
      }
    } else {
      intentResult = detectIntentRuleBased(message);
      aiReply = generateRuleBasedResponse(intentResult.intent, lead);
      nextAction = determineNextAction(intentResult.intent);
    }

    await supabase.from('conversations').insert({
      lead_id,
      message,
      sender: 'user',
      intent: intentResult.intent,
      confidence: intentResult.confidence,
    });

    await supabase.from('conversations').insert({
      lead_id,
      message: aiReply,
      sender: 'agent',
      next_action: nextAction,
    });

    const newScore = calculateLeadScore(
      lead,
      conversationHistory.length + 1,
      intentResult.intent
    );
    const newStatus = determineLeadStatus(newScore, intentResult.intent);

    await supabase
      .from('leads')
      .update({
        lead_score: newScore,
        lead_status: newStatus,
        last_interaction: new Date().toISOString(),
        total_messages: lead.total_messages + 1,
      })
      .eq('id', lead_id);

    await supabase.from('lead_activities').insert({
      lead_id,
      activity_type: intentResult.intent,
      details: {
        message: message.substring(0, 100),
        confidence: intentResult.confidence,
      },
    });

    return new Response(
      JSON.stringify({
        reply: aiReply,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        next_action: nextAction,
        lead_score: newScore,
        lead_status: newStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectIntentRuleBased(message: string): IntentResult {
  const lowerMessage = message.toLowerCase();
  const intents = [
    {
      intent: 'pricing_inquiry',
      keywords: ['price', 'pricing', 'cost', 'how much', 'expensive', 'cheap', 'rate', 'fee', 'charge'],
      confidence: 0,
    },
    {
      intent: 'demo_request',
      keywords: ['demo', 'demonstration', 'show me', 'see it', 'trial', 'test', 'preview'],
      confidence: 0,
    },
    {
      intent: 'feature_inquiry',
      keywords: ['feature', 'functionality', 'capability', 'can it', 'does it', 'how does', 'what can', 'integration'],
      confidence: 0,
    },
    {
      intent: 'follow_up',
      keywords: ['call', 'contact', 'reach out', 'follow up', 'speak', 'talk', 'discuss', 'meeting', 'schedule'],
      confidence: 0,
    },
    {
      intent: 'not_interested',
      keywords: ['not interested', 'no thank', 'not now', 'maybe later', 'don\'t need', 'not looking'],
      confidence: 0,
    },
  ];

  let maxConfidence = 0;
  let detectedIntent = 'general_inquiry';
  let matchedKeywords: string[] = [];

  for (const intentObj of intents) {
    const matches = intentObj.keywords.filter(keyword => lowerMessage.includes(keyword));
    if (matches.length > 0) {
      const confidence = Math.min(0.95, matches.length * 0.3 + 0.5);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        detectedIntent = intentObj.intent;
        matchedKeywords = matches;
      }
    }
  }

  return {
    intent: detectedIntent,
    confidence: maxConfidence || 0.6,
    keywords: matchedKeywords,
  };
}

function generateRuleBasedResponse(intent: string, lead: any): string {
  const responses: Record<string, string> = {
    pricing_inquiry: `Hi ${lead.name}! Our pricing is flexible and starts from ₹999/month for the starter plan. We also have Pro (₹2,999/month) and Enterprise (custom pricing) plans. Would you like me to share a detailed pricing breakdown or schedule a demo?`,
    demo_request: `That's great, ${lead.name}! I'd love to show you our product. We can schedule a personalized demo at your convenience. What day and time works best for you this week?`,
    feature_inquiry: `Hi ${lead.name}! Our platform includes powerful features like AI-powered analytics, real-time collaboration, automated workflows, and seamless integrations with 50+ tools. Which specific feature are you most interested in learning about?`,
    follow_up: `Absolutely, ${lead.name}! I'll have one of our sales representatives reach out to you shortly. Can you confirm the best number and time to reach you?`,
    not_interested: `No problem at all, ${lead.name}! I understand timing isn't right. Feel free to reach out whenever you're ready. Have a great day!`,
    general_inquiry: `Hi ${lead.name}! Thanks for reaching out. I'm here to help! Could you tell me more about what you're looking for? I can provide information about pricing, features, or schedule a demo for you.`,
  };

  return responses[intent] || responses.general_inquiry;
}

async function generateAIResponse(
  message: string,
  history: any[],
  lead: any,
  apiKey: string
): Promise<{ intent: IntentResult; reply: string; nextAction: string }> {
  const systemPrompt = `You are an intelligent sales agent for a SaaS product. Your goal is to:
1. Understand customer intent and provide helpful, concise responses
2. Be professional, friendly, and goal-oriented
3. Guide leads toward booking demos or sharing contact information
4. Qualify leads by understanding their needs

Product Details:
- Starter Plan: ₹999/month - Basic features, 5 users
- Pro Plan: ₹2,999/month - Advanced features, 20 users, priority support
- Enterprise Plan: Custom pricing - Unlimited users, custom integrations

Key Features:
- AI-powered analytics and insights
- Real-time collaboration tools
- Automated workflow management
- 50+ integrations (Slack, Salesforce, etc.)
- 24/7 customer support

Guidelines:
- Keep responses under 3 sentences
- Always end with a question or call-to-action
- Be consultative, not pushy
- Address the lead by name when appropriate`;

  const conversationContext = history
    .map((msg) => `${msg.sender === 'user' ? 'Customer' : 'Agent'}: ${msg.message}`)
    .join('\n');

  const userPrompt = `Lead Name: ${lead.name}
Lead Company: ${lead.company || 'Not provided'}

Conversation History:
${conversationContext}

New Message: ${message}

IMPORTANT: Provide ONLY the customer response text. Do NOT include "Suggested next action for sales rep" or "4. Suggested next action" in your response text.

Provide your response in this format:
Response: [Your response to the customer - just the response text, nothing else]

Intent: [pricing_inquiry, demo_request, feature_inquiry, follow_up, not_interested, or general_inquiry]
Confidence: [0-1]
Next Action: [suggested action]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage += ` - ${errorData.error.message}`;
      }
    } catch (e) {
      // If error response is not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Failed to parse OpenAI API response as JSON');
  }
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI API: missing choices or message');
  }
  
  if (!data.choices[0].message.content) {
    throw new Error('Invalid response from OpenAI API: missing message content');
  }

  const aiResponse = data.choices[0].message.content;

  // Try to parse with labeled format first (Response:, Intent:, etc.)
  const intentMatch = aiResponse.match(/Intent:\s*(\w+)/i);
  const confidenceMatch = aiResponse.match(/Confidence:\s*([0-9.]+)/i);
  const replyMatch = aiResponse.match(/Response:\s*(.+?)(?=Next Action:|$)/is);
  const actionMatch = aiResponse.match(/Next Action:\s*(.+?)$/is);

  const intent = intentMatch ? intentMatch[1].toLowerCase() : detectIntentRuleBased(message).intent;
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75;
  let reply = replyMatch ? replyMatch[1].trim() : aiResponse;
  const nextAction = actionMatch ? actionMatch[1].trim() : determineNextAction(intent);

  if (!replyMatch) {
    reply = aiResponse.split('\n').filter(line => 
      !line.match(/^(Intent|Confidence|Next Action):/i)
    ).join(' ').trim();
  }

  // Robustly remove any "suggested next action" text or numbered suggestions from the reply
  // Remove common labeled patterns and any text following them
  // Patterns include "Suggested next action", "Suggested next action for sales rep", "Next Action",
  // and numbered list items like "4. Suggested next action..." or "4) Suggested next action..."
  const cleanupPatterns = [
    /Suggested next action for sales rep[:\s].*$/i,
    /Suggested next action[:\s].*$/i,
    /Next Action[:\s].*$/i,
    /\d+\s*[\.)]\s*Suggested.*$/im,
    /\d+\s*[:\-]\s*Suggested.*$/im
  ];

  // Find earliest match index among patterns and truncate everything from that point
  let earliestIndex = -1;
  for (const pat of cleanupPatterns) {
    const m = reply.search(pat);
    if (m !== -1) {
      earliestIndex = earliestIndex === -1 ? m : Math.min(earliestIndex, m);
    }
  }
  if (earliestIndex !== -1) {
    reply = reply.substring(0, earliestIndex).trim();
  }

  // Also remove any lines that mention 'suggested' or 'next action' to be safe
  const lines = reply.split(/\r?\n/);
  const filteredLines = lines.filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (/suggested/i.test(t)) return false;
    if (/next action/i.test(t)) return false;
    return true;
  });

  reply = filteredLines.join(' ').trim();

  // Final cleanup: remove leftover trailing punctuation/spaces
  reply = reply.replace(/[\s\.,:;\-]+$/, '').trim();

  return {
    intent: { intent, confidence, keywords: [] },
    reply: reply || generateRuleBasedResponse(intent, lead),
    nextAction,
  };
}

function determineNextAction(intent: string): string {
  const actions: Record<string, string> = {
    pricing_inquiry: 'offer_demo',
    demo_request: 'schedule_demo',
    feature_inquiry: 'share_documentation',
    follow_up: 'schedule_call',
    not_interested: 'mark_cold',
    general_inquiry: 'continue_conversation',
  };

  return actions[intent] || 'continue_conversation';
}

function calculateLeadScore(
  lead: any,
  messageCount: number,
  intent: string
): number {
  let score = lead.lead_score || 0;

  const intentScores: Record<string, number> = {
    pricing_inquiry: 15,
    demo_request: 25,
    feature_inquiry: 10,
    follow_up: 20,
    not_interested: -30,
    general_inquiry: 5,
  };

  score += intentScores[intent] || 5;
  score += Math.min(messageCount * 3, 20);

  return Math.max(0, Math.min(100, score));
}

function determineLeadStatus(score: number, intent: string): string {
  if (intent === 'not_interested') return 'not_interested';
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}