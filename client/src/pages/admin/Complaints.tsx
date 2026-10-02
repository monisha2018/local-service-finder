import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import StatusBadge from "../../components/ui/Badge";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

type ComplaintStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  const [adminResponse, setAdminResponse] = useState("");
  const [complaintStatus, setComplaintStatus] =
    useState<ComplaintStatus>("OPEN");

  const [saving, setSaving] = useState(false);

  const [selectedComplaint, setSelectedComplaint] =
    useState<any | null>(null);

  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");

    try {
      const res = await adminService.complaints();
      setComplaints(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function openComplaint(complaint: any) {
    setSelectedComplaint(complaint);
    setShowResponseForm(false);
    setAdminResponse(complaint.adminResponse || "");
    setComplaintStatus(complaint.status);
  }

  function closeComplaint() {
    setSelectedComplaint(null);
    setShowResponseForm(false);
    setAdminResponse("");
  }

  function openResponseForm() {
    if (!selectedComplaint) return;

    setAdminResponse(selectedComplaint.adminResponse || "");
    setComplaintStatus(selectedComplaint.status);
    setShowResponseForm(true);
  }

  async function saveResponse() {
    if (!selectedComplaint) return;

    if (!adminResponse.trim()) {
      alert("Please enter a response.");
      return;
    }

    setSaving(true);

    try {
      await adminService.updateComplaint(selectedComplaint._id, {
        status: complaintStatus,
        adminResponse: adminResponse.trim(),
      });

      alert("Complaint updated successfully!");

      setShowResponseForm(false);
      setSelectedComplaint(null);
      setAdminResponse("");

      await load();
    } catch {
      alert("Unable to update complaint.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return <LoadingState message="Loading complaints..." />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message="Unable to load complaints."
        onRetry={load}
      />
    );
  }

  if (complaints.length === 0) {
    return (
      <EmptyState
        title="No complaints"
        subtitle="Customer complaints will show up here."
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Complaints
      </h1>

      {/* Complaint List */}
      <div className="space-y-4">
        {complaints.map((c) => (
          <div
            key={c._id}
            className="card cursor-pointer"
            onClick={() => openComplaint(c)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">{c.subject}</p>

              <StatusBadge
                status={
                  c.status === "RESOLVED"
                    ? "COMPLETED"
                    : c.status === "OPEN"
                    ? "PENDING"
                    : c.status
                }
              >
                {c.status}
              </StatusBadge>
            </div>

            <p className="text-sm text-text-secondary mb-2">
              {c.description}
            </p>

            <p className="text-xs text-text-secondary">
              From {c.customerId?.name || "Unknown"} · Booking{" "}
              {c.bookingId?.bookingNumber || "N/A"} · Priority:{" "}
              {c.priority}
            </p>

            {c.adminResponse && (
              <div className="bg-surface rounded-lg p-3 mt-4">
                <p className="text-xs font-semibold mb-1">
                  Admin Response
                </p>

                <p className="text-sm text-text-secondary">
                  {c.adminResponse}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeComplaint}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                Complaint Details
              </h2>

              <button
                type="button"
                onClick={closeComplaint}
                className="text-text-secondary text-xl"
              >
                ✕
              </button>
            </div>

            {/* Complaint Information */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-secondary">
                  Subject
                </p>

                <p className="font-semibold">
                  {selectedComplaint.subject}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">
                  Description
                </p>

                <p className="text-sm">
                  {selectedComplaint.description}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">
                  Customer
                </p>

                <p className="text-sm">
                  {selectedComplaint.customerId?.name || "Unknown"}
                </p>

                {selectedComplaint.customerId?.email && (
                  <p className="text-xs text-text-secondary">
                    {selectedComplaint.customerId.email}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-text-secondary">
                  Booking
                </p>

                <p className="text-sm">
                  {selectedComplaint.bookingId?.bookingNumber ||
                    "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">
                  Priority
                </p>

                <p className="text-sm">
                  {selectedComplaint.priority}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary mb-1">
                  Status
                </p>

                <StatusBadge
                  status={
                    selectedComplaint.status === "RESOLVED"
                      ? "COMPLETED"
                      : selectedComplaint.status === "OPEN"
                      ? "PENDING"
                      : selectedComplaint.status
                  }
                >
                  {selectedComplaint.status}
                </StatusBadge>
              </div>

              {selectedComplaint.adminResponse && (
                <div>
                  <p className="text-xs text-text-secondary">
                    Current Admin Response
                  </p>

                  <p className="text-sm mt-1">
                    {selectedComplaint.adminResponse}
                  </p>
                </div>
              )}
            </div>

            {/* Response Form */}
            {showResponseForm && (
              <div className="border-t border-border pt-5 mt-6">
                <h3 className="font-semibold text-text-primary mb-4">
                  Admin Response
                </h3>

                <textarea
                  value={adminResponse}
                  onChange={(e) =>
                    setAdminResponse(e.target.value)
                  }
                  placeholder="Write your response to the customer..."
                  rows={5}
                  className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Complaint Status
                  </label>

                  <select
                    value={complaintStatus}
                    onChange={(e) =>
                      setComplaintStatus(
                        e.target.value as ComplaintStatus
                      )
                    }
                    className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveResponse}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-medium disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Response"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowResponseForm(false)}
                    className="px-4 py-2 rounded-lg border border-border font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Modal Buttons */}
            {!showResponseForm && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeComplaint}
                  className="px-4 py-2 rounded-lg border border-border font-medium"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={openResponseForm}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-medium"
                >
                  {selectedComplaint.adminResponse
                    ? "Edit Response"
                    : "Respond"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}