import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-error">
        <AlertTriangle size={24} />
      </div>
      <p className="text-sm text-text-secondary max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-primary text-sm font-semibold hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
