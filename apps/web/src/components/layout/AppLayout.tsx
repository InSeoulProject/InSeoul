import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useSimulationStore } from "../../store/simulationStore";
import { logout } from "../../api";

export default function AppLayout() {
  const { user, accessToken, clearAuth } = useAuthStore();
  const reset = useSimulationStore((s) => s.reset);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (accessToken) {
      try { await logout(accessToken); } catch { /* ignore */ }
    }
    clearAuth();
    reset();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/app/input" className="text-lg font-bold text-blue-600">
          InSeoul
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/app/history" className="text-sm text-gray-600 hover:text-gray-900">
            이력
          </Link>
          <span className="text-sm text-gray-500">{user?.nickname ?? ""}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            로그아웃
          </button>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
