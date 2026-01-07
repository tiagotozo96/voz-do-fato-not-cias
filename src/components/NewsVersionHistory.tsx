import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { History, Clock, User, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsVersion {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  version_number: number;
  change_summary: string | null;
  created_at: string;
  changed_by: {
    full_name: string | null;
  } | null;
}

interface NewsVersionHistoryProps {
  newsId: string;
}

export function NewsVersionHistory({ newsId }: NewsVersionHistoryProps) {
  const [versions, setVersions] = useState<NewsVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<NewsVersion | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data, error } = await supabase
          .from('news_versions')
          .select(`
            id,
            title,
            content,
            excerpt,
            version_number,
            change_summary,
            created_at,
            changed_by:profiles(full_name)
          `)
          .eq('news_id', newsId)
          .order('version_number', { ascending: false });

        if (error) throw error;
        setVersions(data || []);
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [newsId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || versions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Versões
          <Badge variant="secondary" className="ml-2">
            {versions.length} versão{versions.length !== 1 ? 'ões' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {versions.map((version) => (
              <Dialog key={version.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-3 hover:bg-muted"
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Versão {version.version_number}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(version.created_at)}
                          </span>
                          {version.changed_by?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.changed_by.full_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {version.title}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Versão {version.version_number}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(version.created_at)}
                        </span>
                        {version.changed_by?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {version.changed_by.full_name}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Título</h4>
                        <p className="text-base font-medium">{version.title}</p>
                      </div>

                      {version.excerpt && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Resumo
                          </h4>
                          <p className="text-sm">{version.excerpt}</p>
                        </div>
                      )}

                      {version.content && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Conteúdo
                          </h4>
                          <div
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: version.content }}
                          />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
