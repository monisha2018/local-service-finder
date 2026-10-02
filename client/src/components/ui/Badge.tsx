import { ReactNode } from "react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROVIDER_ON_THE_WAY: "bg-purple-50 text-primary",
  IN_PROGRESS: "bg-purple-50 text-primary",
  COMPLETED: "bg-green-50 text-success",
  REJECTED: "bg-red-50 text-error",
  CANCELLED: "bg-red-50 text-error",
  REFUNDED: "bg-gray-100 text-text-secondary",
  VERIFIED: "bg-green-50 text-success",
  SUCCESS: "bg-green-50 text-success",
  FAILED: "bg-red-50 text-error",
};

export default function StatusBadge({ status, children }: { status: string; children?: ReactNode }) {
  const style = STATUS_STYLES[status] || "bg-surface-alt text-text-secondary";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {children || status.replace(/_/g, " ")}
    </span>
  );
}
