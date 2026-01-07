import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  MessageCircle, 
  Check, 
  X, 
  Trash2, 
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  news: {
    title: string;
    slug: string;
  } | null;
}

export const CommentsModeration = () => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          author_name,
          author_email,
          content,
          is_approved,
          created_at,
          news:news_id(title, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Comentário aprovado!' });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_approved: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Comentário rejeitado!' });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Comentário excluído!' });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const pendingComments = comments.filter(c => !c.is_approved);
  const approvedComments = comments.filter(c => c.is_approved);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CommentTable = ({ items, showApproveButton }: { items: Comment[], showApproveButton: boolean }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Autor</TableHead>
            <TableHead>Comentário</TableHead>
            <TableHead className="w-[180px]">Notícia</TableHead>
            <TableHead className="w-[140px]">Data</TableHead>
            <TableHead className="w-[150px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhum comentário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            items.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{comment.author_name}</p>
                    <p className="text-xs text-muted-foreground">{comment.author_email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 text-sm">{comment.content}</p>
                </TableCell>
                <TableCell>
                  {comment.news ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{comment.news.title}</p>
                  ) : (
                    <span className="text-xs text-muted-foreground">Notícia removida</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(comment.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {showApproveButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(comment.id)}
                        title="Aprovar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {!showApproveButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        onClick={() => handleReject(comment.id)}
                        title="Reprovar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(comment.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Moderação de Comentários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{pendingComments.length}</p>
              <p className="text-sm text-yellow-600">Pendentes</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{approvedComments.length}</p>
              <p className="text-sm text-green-600">Aprovados</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
              {pendingComments.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingComments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Aprovados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <CommentTable items={pendingComments} showApproveButton={true} />
          </TabsContent>
          
          <TabsContent value="approved">
            <CommentTable items={approvedComments} showApproveButton={false} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};