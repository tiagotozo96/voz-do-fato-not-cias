import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled backup...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all data for backup
    console.log('Fetching news...');
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (newsError) {
      console.error('Error fetching news:', newsError);
      throw newsError;
    }

    console.log('Fetching categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    console.log('Fetching tags...');
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      throw tagsError;
    }

    console.log('Fetching news_tags...');
    const { data: newsTagsData, error: newsTagsError } = await supabase
      .from('news_tags')
      .select('*');

    if (newsTagsError) {
      console.error('Error fetching news_tags:', newsTagsError);
      throw newsTagsError;
    }

    console.log('Fetching newsletter subscribers...');
    const { data: subscribersData, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, name, is_active, is_confirmed, subscribed_at')
      .order('subscribed_at', { ascending: false });

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      throw subscribersError;
    }

    // Create backup object
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      type: 'scheduled',
      news: newsData || [],
      categories: categoriesData || [],
      tags: tagsData || [],
      news_tags: newsTagsData || [],
      subscribers: subscribersData || [],
      stats: {
        newsCount: newsData?.length || 0,
        categoriesCount: categoriesData?.length || 0,
        tagsCount: tagsData?.length || 0,
        subscribersCount: subscribersData?.length || 0,
      },
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const now = new Date();
    const filename = `backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;

    console.log(`Uploading backup to storage: ${filename}`);

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(filename, backupJson, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading backup:', uploadError);
      throw uploadError;
    }

    // Clean up old backups (keep only last 4 weekly backups)
    console.log('Cleaning up old backups...');
    const { data: files, error: listError } = await supabase.storage
      .from('backups')
      .list('', { sortBy: { column: 'created_at', order: 'desc' } });

    if (!listError && files && files.length > 4) {
      const filesToDelete = files.slice(4).map(f => f.name);
      console.log(`Deleting ${filesToDelete.length} old backups`);
      await supabase.storage.from('backups').remove(filesToDelete);
    }

    console.log('Backup completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup completed successfully',
        filename,
        stats: backup.stats,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backup error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
