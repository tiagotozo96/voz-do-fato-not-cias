import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupData {
  news?: any[];
  categories?: any[];
  tags?: any[];
  news_tags?: any[];
  subscribers?: any[];
  exportedAt?: string;
}

interface RestoreOptions {
  restoreNews: boolean;
  restoreCategories: boolean;
  restoreTags: boolean;
  restoreSubscribers: boolean;
  clearExisting: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting backup restoration...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { backup, options, backupFilename }: { backup: BackupData; options: RestoreOptions; backupFilename?: string } = await req.json();

    if (!backup) {
      throw new Error('No backup data provided');
    }

    const backupDate = backup.exportedAt ? new Date(backup.exportedAt) : null;

    const results = {
      categories: { restored: 0, skipped: 0 },
      tags: { restored: 0, skipped: 0 },
      news: { restored: 0, skipped: 0 },
      news_tags: { restored: 0, skipped: 0 },
      subscribers: { restored: 0, skipped: 0 },
    };

    // Restore categories first (news depends on them)
    if (options.restoreCategories && backup.categories?.length) {
      console.log('Restoring categories...');
      
      if (options.clearExisting) {
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      for (const category of backup.categories) {
        const { id, created_at, ...categoryData } = category;
        const { error } = await supabase
          .from('categories')
          .upsert({ id, ...categoryData }, { onConflict: 'id' });
        
        if (error) {
          console.error('Error restoring category:', error);
          results.categories.skipped++;
        } else {
          results.categories.restored++;
        }
      }
    }

    // Restore tags (news_tags depends on them)
    if (options.restoreTags && backup.tags?.length) {
      console.log('Restoring tags...');
      
      if (options.clearExisting) {
        await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      for (const tag of backup.tags) {
        const { id, created_at, ...tagData } = tag;
        const { error } = await supabase
          .from('tags')
          .upsert({ id, ...tagData }, { onConflict: 'id' });
        
        if (error) {
          console.error('Error restoring tag:', error);
          results.tags.skipped++;
        } else {
          results.tags.restored++;
        }
      }
    }

    // Restore news
    if (options.restoreNews && backup.news?.length) {
      console.log('Restoring news...');
      
      if (options.clearExisting) {
        // Delete news_tags first due to FK constraint
        await supabase.from('news_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      for (const newsItem of backup.news) {
        // Remove nested objects that shouldn't be inserted
        const { id, created_at, updated_at, categories, tags, ...newsData } = newsItem;
        const { error } = await supabase
          .from('news')
          .upsert({ id, ...newsData, created_at, updated_at }, { onConflict: 'id' });
        
        if (error) {
          console.error('Error restoring news:', error);
          results.news.skipped++;
        } else {
          results.news.restored++;
        }
      }

      // Restore news_tags relationships
      if (backup.news_tags?.length) {
        console.log('Restoring news_tags relationships...');
        for (const newsTag of backup.news_tags) {
          const { id, created_at, ...newsTagData } = newsTag;
          const { error } = await supabase
            .from('news_tags')
            .upsert({ id, ...newsTagData }, { onConflict: 'id' });
          
          if (error) {
            console.error('Error restoring news_tag:', error);
            results.news_tags.skipped++;
          } else {
            results.news_tags.restored++;
          }
        }
      }
    }

    // Restore subscribers
    if (options.restoreSubscribers && backup.subscribers?.length) {
      console.log('Restoring subscribers...');
      
      if (options.clearExisting) {
        await supabase.from('newsletter_subscribers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      for (const subscriber of backup.subscribers) {
        const { id, ...subscriberData } = subscriber;
        const { error } = await supabase
          .from('newsletter_subscribers')
          .upsert({ id, ...subscriberData }, { onConflict: 'id' });
        
        if (error) {
          console.error('Error restoring subscriber:', error);
          results.subscribers.skipped++;
        } else {
          results.subscribers.restored++;
        }
      }
    }

    console.log('Restoration completed!', results);

    // Log restoration to history
    const { error: historyError } = await supabase
      .from('restoration_history')
      .insert({
        restored_by: userId,
        backup_filename: backupFilename || null,
        backup_date: backupDate,
        options: options,
        results: results,
        status: 'success',
      });

    if (historyError) {
      console.error('Error logging restoration history:', historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup restored successfully',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Restore error:', errorMessage);

    // Log failed restoration to history
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('restoration_history').insert({
        status: 'failed',
        error_message: errorMessage,
      });
    } catch (logError) {
      console.error('Error logging failed restoration:', logError);
    }

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
