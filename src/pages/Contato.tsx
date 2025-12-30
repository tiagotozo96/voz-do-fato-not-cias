import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

const Contato = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Contato
            </h1>
            <p className="text-muted-foreground text-lg">
              Entre em contato com a redação do Voz do Fato
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Informações de Contato</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Endereço</h3>
                    <p className="text-muted-foreground">
                      Av. Principal, 1000 - Centro<br />
                      São Paulo - SP, 01310-100
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefones</h3>
                    <p className="text-muted-foreground">
                      Redação: (11) 3000-1000<br />
                      Comercial: (11) 3000-1001<br />
                      WhatsApp: (11) 99000-1000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-mails</h3>
                    <p className="text-muted-foreground">
                      Redação: redacao@vozdofato.com.br<br />
                      Comercial: comercial@vozdofato.com.br<br />
                      Denúncias: denuncia@vozdofato.com.br
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Horário de Funcionamento</h3>
                    <p className="text-muted-foreground">
                      Segunda a Sexta: 8h às 20h<br />
                      Sábado: 8h às 14h<br />
                      Domingo e Feriados: Plantão
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">Redes Sociais</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Facebook className="w-6 h-6 text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center hover:bg-pink-700 transition-colors">
                    <Instagram className="w-6 h-6 text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors">
                    <Twitter className="w-6 h-6 text-white" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors">
                    <Youtube className="w-6 h-6 text-white" />
                  </a>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Localização</h2>
              <div className="aspect-square lg:aspect-[4/3] bg-muted rounded-lg flex items-center justify-center border border-border">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Mapa interativo</p>
                  <p className="text-sm text-muted-foreground mt-1">(Google Maps será integrado aqui)</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8 p-6 bg-muted rounded-lg">
                <h3 className="font-bold mb-4">Canais de Comunicação</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Envie sua pauta ou sugestão de reportagem
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Denúncias anônimas são tratadas com sigilo
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Assessorias de imprensa: imprensa@vozdofato.com.br
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Parcerias e publicidade: comercial@vozdofato.com.br
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contato;
