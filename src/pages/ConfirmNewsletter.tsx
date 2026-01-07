import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

const ConfirmNewsletter = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processConfirmation = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage('Link inválido. Token não encontrado.');
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-newsletter-subscription?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setEmail(data.email || '');
          if (data.message === 'already_confirmed') {
            setStatus('already');
          } else {
            setStatus('success');
          }
        } else {
          setStatus('error');
          setErrorMessage(data.message || 'Erro ao confirmar inscrição.');
        }
      } catch (error: any) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setErrorMessage('Erro ao conectar com o servidor.');
      }
    };

    processConfirmation();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {status === 'loading' && (
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                )}
                {status === 'success' && (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                )}
                {status === 'already' && (
                  <Mail className="h-16 w-16 text-primary" />
                )}
                {status === 'error' && (
                  <XCircle className="h-16 w-16 text-destructive" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {status === 'loading' && 'Confirmando...'}
                {status === 'success' && 'Inscrição Confirmada!'}
                {status === 'already' && 'Já Confirmado'}
                {status === 'error' && 'Erro'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {status === 'loading' && (
                <p className="text-muted-foreground">
                  Aguarde enquanto confirmamos sua inscrição...
                </p>
              )}
              
              {status === 'success' && (
                <>
                  <p className="text-muted-foreground">
                    Parabéns! Sua inscrição na newsletter foi confirmada com sucesso.
                  </p>
                  {email && (
                    <p className="text-sm text-muted-foreground">
                      E-mail: <strong>{email}</strong>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Você receberá nossas últimas notícias diretamente no seu e-mail.
                  </p>
                </>
              )}
              
              {status === 'already' && (
                <>
                  <p className="text-muted-foreground">
                    Este e-mail já foi confirmado anteriormente.
                  </p>
                  {email && (
                    <p className="text-sm text-muted-foreground">
                      E-mail: <strong>{email}</strong>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Você já está recebendo nossas newsletters!
                  </p>
                </>
              )}
              
              {status === 'error' && (
                <p className="text-destructive">
                  {errorMessage}
                </p>
              )}

              <div className="pt-4">
                <Link to="/">
                  <Button className="w-full">
                    Ir para a página inicial
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConfirmNewsletter;
