import { useEffect, useState } from "react";
import { complaintService } from "../../services/complaintService";
import StatusBadge from "../../components/ui/Badge";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

type ComplaintStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type Complaint = {
  _id: string;
  subject: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: ComplaintStatus;
  adminResponse?: string;
  bookingId?: {
    bookingNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");

    try {
      const res = await complaintService.getMyComplaints();
      setComplaints(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function getStatusBadge(status: ComplaintStatus) {
    if (status === "RESOLVED") return "COMPLETED";
    if (status === "OPEN") return "PENDING";
    return status;
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        My Complaints
      </h1>

      {status === "loading" && (
        <LoadingState message="Loading your complaints..." />
      )}

      {status === "error" && (
        <ErrorState
          message="Unable to load your complaints."
          onRetry={load}
        />
      )}

      {status === "ready" && complaints.length === 0 && (
        <EmptyState
          title="No complaints yet"
          subtitle="Your complaints will appear here."
        />
      )}

      {status === "ready" && complaints.length > 0 && (
        <div className="space-y-5">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="card">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="font-semibold text-text-primary">
                    {complaint.subject}
                  </h2>

                  <p className="text-xs text-text-secondary mt-1">
                    Booking{" "}
                    {complaint.bookingId?.bookingNumber || "N/A"}
                  </p>
                </div>

                <StatusBadge
                  status={getStatusBadge(complaint.status)}
                >
                  {complaint.status}
                </StatusBadge>
              </div>

              {/* Complaint */}
              <div className="mb-4">
                <p className="text-xs text-text-secondary mb-1">
                  Your Complaint
                </p>

                <p className="text-sm text-text-primary">
                  {complaint.description}
                </p>
              </div>

              {/* Priority */}
              <p className="text-xs text-text-secondary mb-4">
                Priority:{" "}
                <span className="font-semibold text-text-primary">
                  {complaint.priority}
                </span>
              </p>

              {/* Admin Response */}
              {complaint.adminResponse ? (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-text-primary mb-2">
                    💬 Admin Response
                  </p>

                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-sm text-text-secondary">
                      {complaint.adminResponse}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-text-secondary">
                    No response from admin yet.
                  </p>
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-text-secondary mt-4">
                Submitted{" "}
                {new Date(complaint.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}