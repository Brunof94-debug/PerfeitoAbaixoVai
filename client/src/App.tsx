// client/src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Importa suas páginas
import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Markets from "./pages/markets";
import Alerts from "./pages/alerts";
import Signals from "./pages/signals";
import Watchlist from "./pages/watchlist";
import Analytics from "./pages/analytics";
import Backtests from "./pages/backtests";
import Profile from "./pages/profile";
import Subscription from "./pages/subscription";
import NotFound from "./pages/not-found";
import CryptoDetail from "./pages/crypto-detail"; // ajuste o nome se o arquivo for diferente

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        {/* Barra de navegação */}
        <header className="p-4 bg-slate-800 flex flex-wrap gap-3 justify-center shadow-md">
          <Link to="/" className="hover:text-cyan-300">🏠 Início</Link>
          <Link to="/dashboard" className="hover:text-cyan-300">📊 Dashboard</Link>
          <Link to="/markets" className="hover:text-cyan-300">💹 Mercados</Link>
          <Link to="/alerts" className="hover:text-cyan-300">🔔 Alertas</Link>
          <Link to="/signals" className="hover:text-cyan-300">📈 Sinais</Link>
          <Link to="/watchlist" className="hover:text-cyan-300">⭐ Watchlist</Link>
          <Link to="/analytics" className="hover:text-cyan-300">📉 Analytics</Link>
          <Link to="/backtests" className="hover:text-cyan-300">🔁 Backtests</Link>
          <Link to="/profile" className="hover:text-cyan-300">👤 Perfil</Link>
          <Link to="/subscription" className="hover:text-cyan-300">💳 Plano</Link>
        </header>

        {/* Conteúdo principal */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/backtests" element={<Backtests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/crypto/:symbol" element={<CryptoDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
