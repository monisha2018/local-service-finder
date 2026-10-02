import { useNotifications } from "../../context/NotificationContext";
import NotificationItem from "../../components/cards/NotificationItem";
import EmptyState from "../../components/ui/EmptyState";

export default function Notifications() {
  const { notifications, markRead } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState title="You're all caught up" subtitle="New notifications will show up here." />
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-border">
          {notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onClick={() => markRead(n._id)} />
          ))}
        </div>
      )}
    </div>
  );
}
