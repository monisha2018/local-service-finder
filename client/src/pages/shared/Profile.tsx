import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
          {user.name[0]}
        </div>
        <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
        <p className="text-text-secondary">{user.email}</p>
        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">{user.role}</p>
        <button onClick={logout} className="mt-6 text-error text-sm font-semibold">Log Out</button>
      </div>
    </div>
  );
}
