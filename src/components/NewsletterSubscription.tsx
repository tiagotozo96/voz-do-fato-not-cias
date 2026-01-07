import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2 } from 'lucide-react';
import { z } from 'zod';

const subscriptionSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
  name: z.string().trim().max(100).optional(),
});

export const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = subscriptionSchema.safeParse({ email, name: name || undefined });
    
    if (!validation.success) {
      toast({
        title: 'Erro',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: validation.data.email,
          name: validation.data.name || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'E-mail já cadastrado',
            description: 'Este e-mail já está inscrito em nossa newsletter.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Inscrição realizada!',
          description: 'Você receberá nossas últimas notícias por e-mail.',
        });
        setEmail('');
        setName('');
      }
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: 'Erro ao inscrever',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="h-6 w-6" />
        <h3 className="text-xl font-bold">Newsletter</h3>
      </div>
      <p className="text-sm opacity-90 mb-4">
        Receba as principais notícias diretamente no seu e-mail.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Seu nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Inscrevendo...
            </>
          ) : (
            'Inscrever-se'
          )}
        </Button>
      </form>
    </div>
  );
};
