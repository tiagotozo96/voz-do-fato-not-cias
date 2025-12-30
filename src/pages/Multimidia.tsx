import { Image, Video, Headphones, FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import policiaNews3 from "@/assets/policia-news-3.jpg";
import policiaNews4 from "@/assets/policia-news-4.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";

const galleries = [
  { title: "Operação Policial em Imagens", images: 24, cover: policiaNews1 },
  { title: "Coletiva de Imprensa", images: 18, cover: policiaNews3 },
  { title: "Tecnologia e Inovação", images: 32, cover: tecnologiaNews },
  { title: "Esportes da Semana", images: 45, cover: esportesNews },
];

const podcasts = [
  { title: "Análise Criminal da Semana", duration: "45:00", episode: 124 },
  { title: "Tecnologia em Debate", duration: "38:20", episode: 89 },
  { title: "Mesa Redonda Esportiva", duration: "1:02:00", episode: 256 },
  { title: "Economia em Foco", duration: "52:30", episode: 178 },
];

const infographics = [
  { title: "Estatísticas de Segurança 2025", cover: policiaNews2 },
  { title: "Mapa do Crime Organizado", cover: policiaNews4 },
  { title: "Evolução Tecnológica", cover: tecnologiaNews },
  { title: "Indicadores Econômicos", cover: tecnologiaNews },
];

const Multimidia = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Multimídia
            </h1>
            <p className="text-muted-foreground text-lg">
              Galerias, podcasts, infográficos e muito mais
            </p>
          </div>
        </section>

        {/* Galleries */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Image className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-display font-bold">Galerias de Fotos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleries.map((gallery, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
                  <img
                    src={gallery.cover}
                    alt={gallery.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Image className="w-10 h-10 text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-sm">
                    {gallery.images} fotos
                  </span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {gallery.title}
                </h3>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="medium" />
        </section>

        {/* Podcasts */}
        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Headphones className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-display font-bold">Podcasts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {podcasts.map((podcast, index) => (
                <div key={index} className="bg-card rounded-lg p-6 shadow-md hover:shadow-elevated transition-all cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Headphones className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Episódio {podcast.episode}</span>
                  <h3 className="font-semibold mt-1 group-hover:text-primary transition-colors">
                    {podcast.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2">{podcast.duration}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Infographics */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-display font-bold">Infográficos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {infographics.map((info, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-muted">
                  <img
                    src={info.cover}
                    alt={info.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold">{info.title}</h3>
                  </div>
                </div>
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

export default Multimidia;
