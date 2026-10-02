import { useEffect, useRef, useState } from "react";
import { providerService } from "../../services/providerService";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/Badge";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Icon from "../../components/ui/Icon";

const DOC_TYPES = ["Government-issued Identity Document", "Professional Certification", "Proof of Experience"];

export default function Verification() {
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const res = await providerService.me();
      setProfile(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function handleFileSelected(docType: string, file: File | undefined) {
    if (!file) return;
    setUploadError("");

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, WEBP, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5MB.");
      return;
    }

    setUploadingType(docType);
    try {
      const res = await providerService.uploadVerificationDoc(file, docType);
      setProfile(res.data);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploadingType(null);
    }
  }

  if (status === "loading") return <LoadingState message="Loading verification status..." />;
  if (status === "error" || !profile) return <ErrorState message="Unable to load your verification status." onRetry={load} />;

  const isVerified = profile.verificationStatus === "VERIFIED";
  const isRejected = profile.verificationStatus === "REJECTED";

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Provider Verification</h1>

      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <Icon name="verified_user" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Verification Status</p>
            <StatusBadge status={profile.verificationStatus}>
              {isVerified ? "Verified" : isRejected ? "Rejected — resubmit documents" : "Under Review"}
            </StatusBadge>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant mb-6">
          Upload your identity document and any relevant certifications. Our team reviews submissions manually —
          this is not an automated government verification check.
        </p>

        {uploadError && <p className="text-error text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>}

        <div className="space-y-4">
          {DOC_TYPES.map((docType) => {
            const existingDocs = (profile.verificationDocs || []).filter((d: any) => d.type === docType);
            return (
              <div key={docType}>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  {docType}
                  {docType !== "Government-issued Identity Document" && <span className="text-on-surface-variant font-normal"> (optional)</span>}
                </label>

                {existingDocs.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {existingDocs.map((doc: any, i: number) => (
                      <a
                        key={i}
                        href={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "")}${doc.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Icon name="description" className="text-[18px]" />
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} — view file
                      </a>
                    ))}
                  </div>
                )}

                <input
                  ref={(el) => (fileInputRefs.current[docType] = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelected(docType, e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={isVerified || uploadingType === docType}
                  onClick={() => fileInputRefs.current[docType]?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center text-on-surface-variant text-sm hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name={uploadingType === docType ? "hourglass_empty" : "upload"} className="mb-2" />
                  {uploadingType === docType ? "Uploading..." : existingDocs.length > 0 ? "Upload a replacement" : "Click to upload (JPG, PNG, or PDF, max 5MB)"}
                </button>
              </div>
            );
          })}
        </div>

        {isVerified && <p className="text-xs text-on-surface-variant mt-4 text-center">You're already verified — no further action needed.</p>}
      </div>
    </div>
  );
}