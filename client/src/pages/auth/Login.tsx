import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "PROVIDER") navigate("/provider/dashboard");
      else if (user.role === "ADMIN") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h1>
      <p className="text-sm text-text-secondary mb-6">Log in to book and manage your services.</p>
      {error && <p className="text-error text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Log In"}</Button>
      </form>
      <p className="text-sm text-text-secondary mt-6 text-center">
        Don't have an account? <Link to="/register" className="text-primary font-semibold">Sign up</Link>
      </p>
      <div className="mt-6 pt-6 border-t border-border text-xs text-text-secondary space-y-1">
        <p className="font-semibold">Demo credentials (after running the seed script):</p>
        <p>Customer: customer1@example.com / Customer@123</p>
        <p>Provider: provider1@example.com / Provider@123</p>
        <p>Admin: admin@localservicefinder.com / Admin@123</p>
      </div>
    </div>
  );
}
