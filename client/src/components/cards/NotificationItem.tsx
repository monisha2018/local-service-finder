import { AppNotification } from "../../types";

export default function NotificationItem({ notification, onClick }: { notification: AppNotification; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-alt transition-colors ${!notification.isRead ? "bg-primary-light/40" : ""}`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notification.isRead ? "bg-primary" : "bg-transparent"}`} />
      <div>
        <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{notification.message}</p>
        <p className="text-xs text-text-secondary mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
      </div>
    </button>
  );
}
