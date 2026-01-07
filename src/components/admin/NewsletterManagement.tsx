import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Users, Send, Loader2, Trash2, History, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  sent_at: string | null;
  recipients_count: number;
  created_at: string;
}

export const NewsletterManagement = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [subscribersResult, campaignsResult] = await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false }),
      supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
    ]);
    
    if (subscribersResult.data) {
      setSubscribers(subscribersResult.data);
    }
    if (campaignsResult.data) {
      setCampaigns(campaignsResult.data);
    }
    
    setIsLoading(false);
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o assunto e o conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    const activeSubscribers = subscribers.filter(s => s.is_active);
    if (activeSubscribers.length === 0) {
      toast({
        title: 'Sem assinantes',
        description: 'Não há assinantes ativos para enviar a newsletter.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Enviar newsletter para ${activeSubscribers.length} assinantes?`)) {
      return;
    }

    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão expirada');
      }

      const response = await supabase.functions.invoke('send-newsletter', {
        body: { subject, content },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      toast({
        title: 'Newsletter enviada!',
        description: `Enviada para ${result.sent} assinantes.${result.failed > 0 ? ` ${result.failed} falharam.` : ''}`,
      });

      setIsDialogOpen(false);
      setSubject('');
      setContent('');
      fetchData();
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsSending(false);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este assinante?')) return;

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Assinante removido!' });
      fetchData();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        is_active: !currentStatus,
        unsubscribed_at: !currentStatus ? null : new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: currentStatus ? 'Assinante desativado' : 'Assinante reativado' });
      fetchData();
    }
  };

  const activeSubscribers = subscribers.filter(s => s.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assinantes</p>
                <p className="text-3xl font-bold">{subscribers.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assinantes Ativos</p>
                <p className="text-3xl font-bold text-green-600">{activeSubscribers}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campanhas Enviadas</p>
                <p className="text-3xl font-bold text-blue-600">{campaigns.length}</p>
              </div>
              <Send className="h-10 w-10 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enviar Newsletter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Assunto do e-mail"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Conteúdo da newsletter (HTML permitido). Use {{name}} para personalizar com o nome do assinante."
                    rows={10}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Será enviada para {activeSubscribers} assinantes ativos
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSendNewsletter}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subscribers">
            <TabsList>
              <TabsTrigger value="subscribers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assinantes
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscribers" className="mt-4">
              {subscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum assinante ainda.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Inscrito em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">
                            {subscriber.email}
                          </TableCell>
                          <TableCell>{subscriber.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>
                              {subscriber.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(subscriber.subscribed_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(subscriber.id, subscriber.is_active)}
                              >
                                {subscriber.is_active ? (
                                  <XCircle className="h-4 w-4 text-yellow-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubscriber(subscriber.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              {campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma campanha enviada ainda.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Destinatários</TableHead>
                        <TableHead>Enviado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">
                            {campaign.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {campaign.recipients_count} envios
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {campaign.sent_at
                              ? format(new Date(campaign.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
