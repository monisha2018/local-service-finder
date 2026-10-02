import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppNotification } from "../types";
import { notificationService } from "../services/notificationService";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => void;
  markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function refresh() {
    if (!user) return;
    try {
      const res = await notificationService.list();
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently ignore — notifications are non-critical
    }
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function markRead(id: string) {
    await notificationService.markRead(id);
    refresh();
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
