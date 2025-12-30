import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import policiaNews3 from "@/assets/policia-news-3.jpg";
import policiaNews4 from "@/assets/policia-news-4.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";

const stories = [
  { title: "Operação Policial: Os Bastidores", image: policiaNews1, views: "15K" },
  { title: "Tecnologia que Muda o Mundo", image: tecnologiaNews, views: "12K" },
  { title: "Investigação em Andamento", image: policiaNews2, views: "10K" },
  { title: "Esportes: Momentos Épicos", image: esportesNews, views: "8K" },
  { title: "Coletiva de Imprensa Exclusiva", image: policiaNews3, views: "7K" },
  { title: "Perícia Criminal em Ação", image: policiaNews4, views: "6K" },
];

const WebStories = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Web Stories
            </h1>
            <p className="text-muted-foreground text-lg">
              Histórias visuais para consumo rápido
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stories.map((story, index) => (
              <div
                key={index}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-elevated transition-all duration-300"
              >
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
                    {story.title}
                  </h3>
                  <span className="text-white/70 text-xs">{story.views} visualizações</span>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-primary animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>

        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4 mb-8">
              Stories Mais Vistos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stories.slice(0, 6).map((story, index) => (
                <div
                  key={`popular-${index}`}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-elevated transition-all duration-300"
                >
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white text-sm font-semibold line-clamp-2">
                      {story.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WebStories;
