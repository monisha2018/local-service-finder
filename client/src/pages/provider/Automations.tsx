import { useState } from "react";
import { providerService } from "../../services/providerService";
import Button from "../../components/ui/Button";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function Automations() {
  const [hours, setHours] = useState(
    DAYS.map((day) => ({ day, startTime: "09:00", endTime: "18:00", isWorking: day !== "SUN" }))
  );
  const [autoAccept, setAutoAccept] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleDay(day: string) {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, isWorking: !h.isWorking } : h)));
  }

  function updateTime(day: string, field: "startTime" | "endTime", value: string) {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, [field]: value } : h)));
  }

  async function save() {
    setSaving(true);
    try {
      await providerService.setAvailability({ workingHours: hours, isAvailable: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Automations & Availability</h1>

      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Working Hours</h2>
        <div className="space-y-3">
          {hours.map((h) => (
            <div key={h.day} className="flex items-center gap-4">
              <button
                onClick={() => toggleDay(h.day)}
                className={`w-20 py-1.5 rounded-lg text-xs font-semibold ${h.isWorking ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {h.day}
              </button>
              {h.isWorking ? (
                <div className="flex items-center gap-2 text-sm">
                  <input type="time" value={h.startTime} onChange={(e) => updateTime(h.day, "startTime", e.target.value)} className="border border-border rounded-lg px-2 py-1.5" />
                  <span className="text-text-secondary">to</span>
                  <input type="time" value={h.endTime} onChange={(e) => updateTime(h.day, "endTime", e.target.value)} className="border border-border rounded-lg px-2 py-1.5" />
                </div>
              ) : (
                <span className="text-sm text-text-secondary">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-text-primary">Auto-accept bookings</p>
          <p className="text-sm text-text-secondary">Automatically accept new requests during your working hours.</p>
        </div>
        <button
          onClick={() => setAutoAccept(!autoAccept)}
          className={`w-12 h-7 rounded-full transition-colors relative ${autoAccept ? "bg-primary" : "bg-gray-200"}`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${autoAccept ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <Button onClick={save} disabled={saving}>{saving ? "Saving..." : saved ? "Saved!" : "Save Availability"}</Button>
    </div>
  );
}
