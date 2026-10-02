import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import StatusBadge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    load();
  }, [q]);

  async function load() {
    setStatus("loading");
    try {
      const res = await adminService.users(q ? { q } : {});
      setUsers(res.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function toggle(u: any) {
    if (u.status === "ACTIVE") await adminService.suspendUser(u._id);
    else await adminService.reactivateUser(u._id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Users</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email..."
        className="input-field max-w-sm mb-6"
      />

      {status === "loading" && <LoadingState message="Loading users..." />}
      {status === "error" && <ErrorState message="Unable to load users." onRetry={load} />}
      {status === "ready" && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-left">
              <tr>
                <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-border">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-text-secondary">{u.email}</td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4"><StatusBadge status={u.status === "ACTIVE" ? "COMPLETED" : "CANCELLED"}>{u.status}</StatusBadge></td>
                  <td className="p-4">
                    <Button size="sm" variant={u.status === "ACTIVE" ? "danger" : "secondary"} onClick={() => toggle(u)}>
                      {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
