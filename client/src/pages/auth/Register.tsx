import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" as "CUSTOMER" | "PROVIDER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
            const user = await register(form);
      navigate(user.role === "PROVIDER" ? "/provider/onboarding" : "/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Create your account</h1>
      <p className="text-sm text-text-secondary mb-6">Join thousands finding trusted local professionals.</p>
      {error && <p className="text-error text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">I am a...</label>
          <div className="flex gap-3">
            {(["CUSTOMER", "PROVIDER"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border ${
                  form.role === r ? "bg-primary text-white border-primary" : "border-border text-text-secondary"
                }`}
              >
                {r === "CUSTOMER" ? "Customer" : "Service Provider"}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Sign Up"}</Button>
      </form>
      <p className="text-sm text-text-secondary mt-6 text-center">
        Already have an account? <Link to="/login" className="text-primary font-semibold">Log in</Link>
      </p>
    </div>
  );
}
