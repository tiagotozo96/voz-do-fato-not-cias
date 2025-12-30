import { Play } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";
import economiaNews from "@/assets/economia-news.jpg";
import entretenimentoNews from "@/assets/entretenimento-news.jpg";

const videos = [
  { title: "Operação Policial: Imagens Exclusivas", thumbnail: policiaNews1, duration: "5:32", views: "25K", category: "POLÍCIA" },
  { title: "Entrevista: Especialista em Tecnologia", thumbnail: tecnologiaNews, duration: "12:45", views: "18K", category: "TECNOLOGIA" },
  { title: "Gols da Rodada - Campeonato Brasileiro", thumbnail: esportesNews, duration: "8:20", views: "45K", category: "ESPORTES" },
  { title: "Análise Econômica da Semana", thumbnail: economiaNews, duration: "15:00", views: "12K", category: "ECONOMIA" },
  { title: "Coletiva de Imprensa ao Vivo", thumbnail: policiaNews2, duration: "32:10", views: "8K", category: "POLÍCIA" },
  { title: "Bastidores do Show Internacional", thumbnail: entretenimentoNews, duration: "6:45", views: "30K", category: "ENTRETENIMENTO" },
];

const Videos = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Vídeos
            </h1>
            <p className="text-muted-foreground text-lg">
              Assista aos principais vídeos e reportagens
            </p>
          </div>
        </section>

        {/* Featured Video */}
        <section className="container mx-auto px-4 py-12">
          <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group">
            <img
              src={policiaNews1}
              alt="Vídeo em destaque"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors">
                <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-semibold">
                EM DESTAQUE
              </span>
              <h2 className="text-white text-2xl font-bold mt-2">
                Operação Policial: Imagens Exclusivas da Ação
              </h2>
              <p className="text-white/80 mt-1">25K visualizações • 5:32</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="medium" />
        </section>

        {/* Video Grid */}
        <section className="container mx-auto px-4 pb-12">
          <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4 mb-8">
            Últimos Vídeos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="w-7 h-7 text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-sm">
                    {video.duration}
                  </span>
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-semibold">
                    {video.category}
                  </span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{video.views} visualizações</p>
              </div>
            ))}
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

export default Videos;
