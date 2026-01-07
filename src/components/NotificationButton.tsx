import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NotificationButton = () => {
  const { isSupported, isSubscribed, permission, requestPermission } = usePushNotifications();

  if (!isSupported) return null;

  const getTooltipContent = () => {
    if (isSubscribed) return "Notificações ativadas";
    if (permission === "denied") return "Notificações bloqueadas";
    return "Ativar notificações";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => !isSubscribed && requestPermission()}
          disabled={permission === "denied"}
          aria-label={getTooltipContent()}
        >
          {isSubscribed ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  );
};
