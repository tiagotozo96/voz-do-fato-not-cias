import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      setIsSubscribed(Notification.permission === "granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsSubscribed(result === "granted");

      if (result === "granted") {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas sobre novas notícias.",
        });

        // Show a test notification
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Voz do Fato", {
            body: "Notificações ativadas com sucesso!",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "welcome",
          });
        }

        return true;
      } else if (result === "denied") {
        toast({
          title: "Notificações bloqueadas",
          description: "Você pode ativá-las nas configurações do navegador.",
          variant: "destructive",
        });
      }

      return false;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar as notificações.",
        variant: "destructive",
      });
      return false;
    }
  }, [isSupported]);

  const sendLocalNotification = useCallback(
    async (title: string, body: string, url?: string) => {
      if (!isSubscribed || !isSupported) return;

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: { url },
            requireInteraction: true,
          });
        }
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }
    },
    [isSupported, isSubscribed]
  );

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    sendLocalNotification,
  };
};
