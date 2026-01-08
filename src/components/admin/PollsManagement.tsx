import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, BarChart3, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Poll {
  id: string;
  news_id: string;
  question: string;
  is_active: boolean;
  ends_at: string | null;
  created_at: string;
  news?: { title: string } | null;
  options?: PollOption[];
}

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
}

interface News {
  id: string;
  title: string;
}

export const PollsManagement = () => {
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedNewsId, setSelectedNewsId] = useState('');
  const [question, setQuestion] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [endsAt, setEndsAt] = useState<Date | undefined>(undefined);
  const [endsTime, setEndsTime] = useState('23:59');
  const [options, setOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const [pollsResult, newsResult] = await Promise.all([
      supabase
        .from('polls')
        .select(`
          *,
          news:news_id(title),
          options:poll_options(*)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('news')
        .select('id, title')
        .eq('is_published', true)
        .order('title')
    ]);

    if (pollsResult.data) {
      setPolls(pollsResult.data as Poll[]);
    }
    if (newsResult.data) {
      setNews(newsResult.data);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setSelectedNewsId('');
    setQuestion('');
    setIsActive(true);
    setEndsAt(undefined);
    setEndsTime('23:59');
    setOptions(['', '']);
    setEditingPoll(null);
  };

  const openEditDialog = (poll: Poll) => {
    setEditingPoll(poll);
    setSelectedNewsId(poll.news_id);
    setQuestion(poll.question);
    setIsActive(poll.is_active);
    
    if (poll.ends_at) {
      const endsDate = new Date(poll.ends_at);
      setEndsAt(endsDate);
      setEndsTime(format(endsDate, 'HH:mm'));
    } else {
      setEndsAt(undefined);
      setEndsTime('23:59');
    }
    
    if (poll.options && poll.options.length > 0) {
      setOptions(poll.options.map(o => o.option_text));
    } else {
      setOptions(['', '']);
    }
    
    setIsDialogOpen(true);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!selectedNewsId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione uma notícia.',
        variant: 'destructive',
      });
      return;
    }

    if (!question.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha a pergunta da enquete.',
        variant: 'destructive',
      });
      return;
    }

    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast({
        title: 'Opções insuficientes',
        description: 'A enquete precisa de pelo menos 2 opções.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      let endsAtISO: string | null = null;
      if (endsAt) {
        const [hours, minutes] = endsTime.split(':').map(Number);
        const endsDateTime = new Date(endsAt);
        endsDateTime.setHours(hours, minutes, 0, 0);
        endsAtISO = endsDateTime.toISOString();
      }

      const pollData = {
        news_id: selectedNewsId,
        question: question.trim(),
        is_active: isActive,
        ends_at: endsAtISO,
      };

      let pollId = editingPoll?.id;

      if (editingPoll) {
        const { error } = await supabase
          .from('polls')
          .update(pollData)
          .eq('id', editingPoll.id);

        if (error) throw error;

        // Delete existing options and recreate
        await supabase.from('poll_options').delete().eq('poll_id', editingPoll.id);
      } else {
        const { data, error } = await supabase
          .from('polls')
          .insert(pollData)
          .select('id')
          .single();

        if (error) throw error;
        pollId = data.id;
      }

      // Insert options
      if (pollId) {
        const optionInserts = validOptions.map(optionText => ({
          poll_id: pollId,
          option_text: optionText.trim(),
        }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionInserts);

        if (optionsError) throw optionsError;
      }

      toast({ title: editingPoll ? 'Enquete atualizada!' : 'Enquete criada!' });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta enquete?')) return;

    // Delete options first
    await supabase.from('poll_options').delete().eq('poll_id', id);
    
    const { error } = await supabase.from('polls').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Enquete excluída!' });
      fetchData();
    }
  };

  const toggleActive = async (poll: Poll) => {
    const { error } = await supabase
      .from('polls')
      .update({ is_active: !poll.is_active })
      .eq('id', poll.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      fetchData();
    }
  };

  const getTotalVotes = (poll: Poll) => {
    return poll.options?.reduce((acc, opt) => acc + opt.votes_count, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enquetes
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie enquetes vinculadas às notícias
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Enquete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPoll ? 'Editar Enquete' : 'Nova Enquete'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newsSelect">Notícia *</Label>
                <Select value={selectedNewsId} onValueChange={setSelectedNewsId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma notícia" />
                  </SelectTrigger>
                  <SelectContent>
                    {news.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.title.length > 50 ? n.title.substring(0, 50) + '...' : n.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Pergunta *</Label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Qual sua opinião sobre o assunto?"
                />
              </div>

              <div className="space-y-2">
                <Label>Opções (mín. 2, máx. 6)</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Data de Expiração (opcional)</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !endsAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endsAt ? format(endsAt, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endsAt}
                        onSelect={setEndsAt}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={endsTime}
                    onChange={(e) => setEndsTime(e.target.value)}
                    className="w-28"
                  />
                  {endsAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEndsAt(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Enquete ativa</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pergunta</TableHead>
              <TableHead>Notícia</TableHead>
              <TableHead>Votos</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {polls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma enquete cadastrada. Clique em "Nova Enquete" para começar.
                </TableCell>
              </TableRow>
            ) : (
              polls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {poll.question}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {poll.news?.title || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getTotalVotes(poll)} votos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {poll.ends_at
                      ? format(new Date(poll.ends_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : 'Sem prazo'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={poll.is_active ? 'default' : 'secondary'}>
                      {poll.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(poll)}
                      title={poll.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <BarChart3 className={cn("h-4 w-4", poll.is_active ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(poll)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(poll.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
