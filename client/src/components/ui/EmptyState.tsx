import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center mb-2 text-primary">
        {icon || <Inbox size={24} />}
      </div>
      <p className="font-semibold text-text-primary">{title}</p>
      {subtitle && <p className="text-sm text-text-secondary max-w-sm">{subtitle}</p>}
      {action}
    </div>
  );
}
