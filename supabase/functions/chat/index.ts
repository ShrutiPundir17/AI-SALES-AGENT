import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { ChatOpenAI, OpenAIEmbeddings } from 'npm:@langchain/openai@0.3.0';
import { ChatPromptTemplate } from 'npm:@langchain/core/prompts@0.3.0';
import { StringOutputParser } from 'npm:@langchain/core/output_parsers@0.3.0';
import { RunnableSequence } from 'npm:@langchain/core/runnables@0.3.0';

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

/**
 * Universal AI chat with LangChain + RAG.
 * - Uses Supabase `conversations` table for history
 * - Uses `knowledge_base` + pgvector for retrieval (if configured)
 * - Falls back gracefully when RAG data is missing
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, message, lead_info }: ChatRequest = await req.json();

    if (!lead_id || !message) {
      return new Response(
        JSON.stringify({ error: 'lead_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: upsert basic lead info for analytics/CRM
    if (lead_info?.email) {
      await supabase
        .from('leads')
        .upsert(
          {
            id: lead_id,
            name: lead_info.name || 'Unknown',
            email: lead_info.email,
            phone: lead_info.phone,
            company: lead_info.company,
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();
    }

    // Load recent conversation history for context
    const { data: recentMessages, error: historyError } = await supabase
      .from('conversations')
      .select('message, sender')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error loading conversation history:', historyError);
    }

    const conversationHistory = (recentMessages || []).reverse();

    let reply = '';

    if (!openaiApiKey) {
      reply =
        'The AI service is not configured yet (missing OPENAI_API_KEY). Please contact the administrator.';
    } else {
      // LangChain + RAG pipeline
      const llm = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
        openAIApiKey,
      });

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey,
      });

      // Retrieve domain knowledge (if `knowledge_base` + pgvector are configured)
      const knowledge = await retrieveKnowledge(message, embeddings, supabase);

      const historyLines = conversationHistory
        .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
        .join('\n');

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are a universal AI assistant that can answer ANY kind of question.

You have access to the following context (may be empty):
{knowledge}

Guidelines:
- Answer accurately and helpfully.
- If the context is relevant, prefer it over your general knowledge.
- If you genuinely don't know, say you don't know.
- Keep answers clear and well structured, but not overly long.`,
        ],
        [
          'system',
          `Conversation so far (may be empty):
{history}`,
        ],
        ['human', '{question}'],
      ]);

      const chain = RunnableSequence.from([
        prompt,
        llm,
        new StringOutputParser(),
      ]);

      reply = await chain.invoke({
        knowledge: knowledge || 'No specific knowledge base entries were found for this query.',
        history: historyLines || 'No previous messages.',
        question: message,
      });
    }

    // Store messages in conversations table (simple chat log)
    const inserts = [
      {
        lead_id,
        message,
        sender: 'user' as const,
      },
      {
        lead_id,
        message: reply,
        sender: 'agent' as const,
      },
    ];

    const { error: insertError } = await supabase.from('conversations').insert(inserts);
    if (insertError) {
      console.error('Error inserting conversations:', insertError);
    }

    return new Response(
      JSON.stringify({ reply }),
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

/**
 * Retrieve relevant knowledge for RAG.
 * Tries pgvector-based similarity search via `match_knowledge`,
 * falls back to simple ILIKE keyword search if unavailable.
 */
async function retrieveKnowledge(
  query: string,
  embeddings: OpenAIEmbeddings,
  supabase: any
): Promise<string | null> {
  try {
    let combinedContext = '';

    // Try vector similarity search first
    try {
      const embedding = await embeddings.embedQuery(query);

      const { data: matches, error: matchError } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
      });

      if (matchError) {
        console.warn('match_knowledge RPC error, falling back to keyword search:', matchError);
      } else if (matches && matches.length > 0) {
        combinedContext = matches
          .map(
            (row: any) =>
              `Title: ${row.title ?? 'Untitled'}\nContent: ${row.content ?? ''}`
          )
          .join('\n\n');
      }
    } catch (e) {
      console.warn('Vector search failed or not configured, falling back to keyword search:', e);
    }

    if (combinedContext) {
      return combinedContext;
    }

    // Fallback: keyword search on content
    const { data: keywordMatches, error: keywordError } = await supabase
      .from('knowledge_base')
      .select('title, content')
      .ilike('content', `%${query}%`)
      .limit(5);

    if (keywordError) {
      console.warn('Keyword search error:', keywordError);
      return null;
    }

    if (!keywordMatches || keywordMatches.length === 0) {
      return null;
    }

    return keywordMatches
      .map(
        (row: any) =>
          `Title: ${row.title ?? 'Untitled'}\nContent: ${row.content ?? ''}`
      )
      .join('\n\n');
  } catch (error) {
    console.error('retrieveKnowledge error:', error);
    return null;
  }
}


