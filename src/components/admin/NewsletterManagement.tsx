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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mail, Users, Send, Loader2, Trash2, History, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_confirmed: boolean;
  subscribed_at: string;
  confirmed_at: string | null;
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
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'email' | 'subscribed_at'>('subscribed_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;
  
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

  const handleResendConfirmation = async (subscriber: Subscriber) => {
    setResendingId(subscriber.id);
    
    try {
      const response = await supabase.functions.invoke('confirm-newsletter-subscription', {
        body: { email: subscriber.email, name: subscriber.name },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'E-mail reenviado!',
        description: `E-mail de confirmação reenviado para ${subscriber.email}`,
      });
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast({
        title: 'Erro ao reenviar',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setResendingId(null);
  };

  const activeSubscribers = subscribers.filter(s => s.is_active && s.is_confirmed).length;
  const pendingSubscribers = subscribers.filter(s => !s.is_confirmed).length;

  const filteredSubscribers = subscribers.filter(s => {
    const matchesStatus = statusFilter === 'all' 
      || (statusFilter === 'confirmed' && s.is_confirmed) 
      || (statusFilter === 'pending' && !s.is_confirmed);
    
    const matchesSearch = searchQuery === '' 
      || s.email.toLowerCase().includes(searchQuery.toLowerCase())
      || (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const sortedSubscribers = [...filteredSubscribers].sort((a, b) => {
    if (sortField === 'email') {
      const comparison = a.email.localeCompare(b.email);
      return sortDirection === 'asc' ? comparison : -comparison;
    } else {
      const comparison = new Date(a.subscribed_at).getTime() - new Date(b.subscribed_at).getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    }
  });

  const totalPages = Math.ceil(sortedSubscribers.length / itemsPerPage);
  const paginatedSubscribers = sortedSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter or search changes
  const handleFilterChange = (value: 'all' | 'confirmed' | 'pending') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (field: 'email' | 'subscribed_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: 'email' | 'subscribed_at' }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Confirmados e Ativos</p>
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
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingSubscribers}</p>
              </div>
              <Mail className="h-10 w-10 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campanhas</p>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por e-mail ou nome..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                    Filtrar por:
                  </Label>
                  <Select value={statusFilter} onValueChange={handleFilterChange}>
                    <SelectTrigger id="status-filter" className="w-[180px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos ({subscribers.length})</SelectItem>
                      <SelectItem value="confirmed">Confirmados ({activeSubscribers})</SelectItem>
                      <SelectItem value="pending">Pendentes ({pendingSubscribers})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredSubscribers.length} {filteredSubscribers.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                    {searchQuery && ` para "${searchQuery}"`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtros
                  </Button>
                </div>
              )}
              {filteredSubscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {subscribers.length === 0 ? 'Nenhum assinante ainda.' : 'Nenhum assinante encontrado com este filtro.'}
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            E-mail
                            <SortIcon field="email" />
                          </button>
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confirmado</TableHead>
                        <TableHead>
                          <button
                            onClick={() => handleSort('subscribed_at')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            Inscrito em
                            <SortIcon field="subscribed_at" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubscribers.map((subscriber) => (
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
                            {subscriber.is_confirmed ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Confirmado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(subscriber.subscribed_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex justify-end gap-2">
                                {!subscriber.is_confirmed && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleResendConfirmation(subscriber)}
                                        disabled={resendingId === subscriber.id}
                                      >
                                        {resendingId === subscriber.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        ) : (
                                          <RefreshCw className="h-4 w-4 text-blue-600" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reenviar e-mail de confirmação</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{subscriber.is_active ? 'Desativar assinante' : 'Reativar assinante'}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSubscriber(subscriber.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover assinante</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredSubscribers.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSubscribers.length)} de {filteredSubscribers.length} assinantes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
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
