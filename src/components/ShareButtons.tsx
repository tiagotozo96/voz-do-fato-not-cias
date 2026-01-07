import { Facebook, Twitter, Linkedin, Link as LinkIcon, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
  variant?: "icon" | "full";
  className?: string;
}

export const ShareButtons = ({
  url,
  title,
  description = "",
  variant = "icon",
  className = "",
}: ShareButtonsProps) => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async (platform: string) => {
    let shareLink = "";

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
        break;
      case "whatsapp":
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: description,
              url: shareUrl,
            });
            return;
          } catch (error) {
            if ((error as Error).name !== "AbortError") {
              console.error("Erro ao compartilhar:", error);
            }
            return;
          }
        }
        // Fallback to copy
        handleShare("copy");
        return;
      case "copy":
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copiado!",
            description: "O link foi copiado para a área de transferência.",
          });
        } catch (error) {
          toast({
            title: "Erro ao copiar",
            description: "Não foi possível copiar o link.",
            variant: "destructive",
          });
        }
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400,noopener,noreferrer");
    }
  };

  if (variant === "full") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Share2 className="h-4 w-4" />
          Compartilhar:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("facebook")}
          className="hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
        >
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("twitter")}
          className="hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
        >
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("whatsapp")}
          className="hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
        onClick={() => handleShare("facebook")}
        aria-label="Compartilhar no Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
        onClick={() => handleShare("twitter")}
        aria-label="Compartilhar no Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
        onClick={() => handleShare("whatsapp")}
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
        onClick={() => handleShare("linkedin")}
        aria-label="Compartilhar no LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 hover:bg-muted"
        onClick={() => handleShare("copy")}
        aria-label="Copiar link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      {typeof navigator !== "undefined" && navigator.share && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 hover:bg-primary hover:text-primary-foreground"
          onClick={() => handleShare("native")}
          aria-label="Mais opções de compartilhamento"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
