import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedLayout() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (!isAdmin) {
      void signOut();
      navigate("/login", { replace: true });
    }
  }, [session, isAdmin, loading, navigate, signOut, location.pathname]);

  // ✅ Tampilkan loading spinner selama cek sesi
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text font-sans">
        Memuat sesi…
      </div>
    );
  }

  // ✅ Jangan render apapun jika tidak ada sesi (redirect sedang berjalan)
  if (!session || !isAdmin) return null;

  return <Outlet />;
}