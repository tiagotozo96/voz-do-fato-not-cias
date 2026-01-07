import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  ends_at: string | null;
  options: PollOption[];
}

interface NewsPollProps {
  newsId: string;
}

export function NewsPoll({ newsId }: NewsPollProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const getVoterId = () => {
    let voterId = localStorage.getItem('poll_voter_id');
    if (!voterId) {
      voterId = crypto.randomUUID();
      localStorage.setItem('poll_voter_id', voterId);
    }
    return voterId;
  };

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('id, question, is_active, ends_at')
          .eq('news_id', newsId)
          .eq('is_active', true)
          .maybeSingle();

        if (pollError) throw pollError;
        if (!pollData) {
          setIsLoading(false);
          return;
        }

        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('id, option_text, votes_count')
          .eq('poll_id', pollData.id)
          .order('created_at');

        if (optionsError) throw optionsError;

        setPoll({
          ...pollData,
          options: optionsData || [],
        });

        // Check if user already voted
        const voterId = getVoterId();
        const { data: voteData } = await supabase
          .from('poll_votes')
          .select('option_id')
          .eq('poll_id', pollData.id)
          .eq('voter_id', voterId)
          .maybeSingle();

        if (voteData) {
          setHasVoted(true);
          setSelectedOption(voteData.option_id);
        }
      } catch (error) {
        console.error('Error fetching poll:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [newsId]);

  const handleVote = async (optionId: string) => {
    if (hasVoted || isVoting || !poll) return;

    setIsVoting(true);
    const voterId = getVoterId();

    try {
      // Insert vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: poll.id,
          option_id: optionId,
          voter_id: voterId,
        });

      if (voteError) {
        if (voteError.code === '23505') {
          toast({
            title: 'Você já votou',
            description: 'Você já participou desta enquete.',
            variant: 'destructive',
          });
          return;
        }
        throw voteError;
      }

      // Increment vote count
      await supabase.rpc('increment_poll_vote', { p_option_id: optionId });

      // Update local state
      setPoll((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          options: prev.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, votes_count: opt.votes_count + 1 }
              : opt
          ),
        };
      });

      setHasVoted(true);
      setSelectedOption(optionId);

      toast({
        title: 'Voto registrado!',
        description: 'Obrigado por participar da enquete.',
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Erro ao votar',
        description: 'Não foi possível registrar seu voto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading || !poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes_count, 0);
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Enquete
          </CardTitle>
          {isExpired ? (
            <Badge variant="secondary">Encerrada</Badge>
          ) : poll.ends_at ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Até {new Date(poll.ends_at).toLocaleDateString('pt-BR')}
            </Badge>
          ) : null}
        </div>
        <p className="text-base font-medium mt-2">{poll.question}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id} className="space-y-1">
              {hasVoted || isExpired ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? 'font-medium' : ''}>
                      {option.option_text}
                      {isSelected && <Check className="inline h-4 w-4 ml-1 text-primary" />}
                    </span>
                    <span className="text-muted-foreground">
                      {percentage.toFixed(0)}% ({option.votes_count})
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting}
                >
                  {option.option_text}
                </Button>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-2">
          {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
