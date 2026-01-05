import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const now = new Date().toISOString()

    console.log(`[publish-scheduled-news] Checking for scheduled news at ${now}`)

    // Find all news that should be published
    const { data: scheduledNews, error: fetchError } = await supabase
      .from('news')
      .select('id, title, scheduled_at')
      .eq('is_published', false)
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now)

    if (fetchError) {
      console.error('[publish-scheduled-news] Error fetching scheduled news:', fetchError)
      throw fetchError
    }

    if (!scheduledNews || scheduledNews.length === 0) {
      console.log('[publish-scheduled-news] No scheduled news to publish')
      return new Response(
        JSON.stringify({ message: 'No scheduled news to publish', published: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[publish-scheduled-news] Found ${scheduledNews.length} news to publish`)

    // Publish each news
    const newsIds = scheduledNews.map(n => n.id)
    const { error: updateError } = await supabase
      .from('news')
      .update({
        is_published: true,
        published_at: now,
        scheduled_at: null
      })
      .in('id', newsIds)

    if (updateError) {
      console.error('[publish-scheduled-news] Error publishing news:', updateError)
      throw updateError
    }

    const publishedTitles = scheduledNews.map(n => n.title)
    console.log('[publish-scheduled-news] Successfully published:', publishedTitles)

    return new Response(
      JSON.stringify({ 
        message: `Published ${scheduledNews.length} news`,
        published: scheduledNews.length,
        titles: publishedTitles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[publish-scheduled-news] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
