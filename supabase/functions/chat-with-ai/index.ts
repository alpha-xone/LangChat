import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { message, threadId, userId } = await req.json()

    // Verify user owns the thread
    const { data: thread, error: threadError } = await supabaseClient
      .from('chat_threads')
      .select('user_id')
      .eq('id', threadId)
      .eq('user_id', userId)
      .single()

    if (threadError || !thread) {
      return new Response(
        JSON.stringify({ error: 'Thread not found or access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get recent chat history for context
    const { data: recentMessages } = await supabaseClient
      .from('chat_messages')
      .select('content, role')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Prepare conversation context
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map(msg => ({ role: msg.role, content: msg.content }))

    // Call LangGraph API (replace with your actual endpoint)
    const langGraphResponse = await fetch(
      Deno.env.get('LANGGRAPH_API_URL') ?? 'http://localhost:2024',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('LANGGRAPH_API_KEY') ?? ''}`,
        },
        body: JSON.stringify({
          message,
          thread_id: threadId,
          history: conversationHistory,
          assistant_id: Deno.env.get('LANGGRAPH_ASSISTANT_ID') ?? 'agent',
        }),
      }
    )

    if (!langGraphResponse.ok) {
      const errorText = await langGraphResponse.text()
      console.error('LangGraph API error:', errorText)

      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable',
          content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.'
        }),
        {
          status: 200, // Return 200 with fallback message instead of error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const aiResponse = await langGraphResponse.json()

    // Extract content from LangGraph response
    const content = aiResponse.content || aiResponse.message || 'I received your message but couldn\'t generate a proper response.'
    const metadata = {
      model: aiResponse.model,
      usage: aiResponse.usage,
      timestamp: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify({
        content,
        metadata,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        content: 'I encountered an unexpected error. Please try again.'
      }),
      {
        status: 200, // Return 200 with fallback message
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
