import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Send email notification
    const adminEmail = Deno.env.get('BACKUP_NOTIFICATION_EMAIL');
    if (adminEmail && resend) {
      try {
        console.log('Sending backup notification email to:', adminEmail);
        await resend.emails.send({
          from: 'Backup System <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `✅ Backup Automático Concluído - ${filename}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10b981;">✅ Backup Concluído com Sucesso</h1>
              <p>O backup automático foi realizado com sucesso.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📊 Estatísticas do Backup</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>📰 <strong>Notícias:</strong> ${backup.stats.newsCount}</li>
                  <li>📁 <strong>Categorias:</strong> ${backup.stats.categoriesCount}</li>
                  <li>🏷️ <strong>Tags:</strong> ${backup.stats.tagsCount}</li>
                  <li>📧 <strong>Assinantes:</strong> ${backup.stats.subscribersCount}</li>
                </ul>
              </div>
              
              <p><strong>Arquivo:</strong> ${filename}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Este é um email automático do sistema de backup.
              </p>
            </div>
          `,
        });
        console.log('Backup notification email sent successfully');
      } catch (emailError) {
        console.error('Error sending backup notification email:', emailError);
        // Don't throw - backup was successful, email failure is non-critical
      }
    } else {
      console.log('No BACKUP_NOTIFICATION_EMAIL configured, skipping notification');
    }

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
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Backup error:', errorMessage);

    // Send failure notification email
    const adminEmail = Deno.env.get('BACKUP_NOTIFICATION_EMAIL');
    if (adminEmail && resend) {
      try {
        console.log('Sending backup failure notification email to:', adminEmail);
        await resend.emails.send({
          from: 'Backup System <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `❌ Falha no Backup Automático`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ef4444;">❌ Falha no Backup Automático</h1>
              <p>O backup automático falhou. Por favor, verifique o sistema.</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="margin-top: 0; color: #dc2626;">🔴 Detalhes do Erro</h3>
                <p><strong>Mensagem:</strong></p>
                <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${errorMessage}</pre>
                ${errorStack ? `
                <p><strong>Stack Trace:</strong></p>
                <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; max-height: 200px; overflow-y: auto;">${errorStack}</pre>
                ` : ''}
              </div>
              
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Ação Recomendada:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Verifique os logs da edge function</li>
                  <li>Confirme que o bucket de backups existe</li>
                  <li>Verifique as permissões do service role</li>
                  <li>Execute um backup manual para testar</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Este é um email automático do sistema de backup.
              </p>
            </div>
          `,
        });
        console.log('Backup failure notification email sent successfully');
      } catch (emailError) {
        console.error('Error sending backup failure notification email:', emailError);
      }
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
