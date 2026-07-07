'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Eye, 
  Users, 
  Link2, 
  TrendingUp, 
  Compass, 
  RefreshCw, 
  FileText, 
  Lock, 
  Smartphone, 
  Monitor, 
  Download, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

interface Visit {
  id: string;
  timestamp: string;
  path: string;
  referrer: string;
  userAgent: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  referrers: Record<string, number>;
  pages: Record<string, number>;
  utmSources: Record<string, number>;
  history: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  recentVisits: Visit[];
}

export default function AdminDashboard() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);

  // Carregar PIN salvo
  useEffect(() => {
    const savedPin = localStorage.getItem('mtech_admin_pin');
    if (savedPin) {
      verifyPin(savedPin);
    }
  }, [days]);

  const verifyPin = async (inputPin: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics?pin=${inputPin}&days=${days}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setIsAuthenticated(true);
        localStorage.setItem('mtech_admin_pin', inputPin);
      } else {
        const errData = await res.json();
        setError(errData.error || 'PIN inválido');
        setIsAuthenticated(false);
        localStorage.removeItem('mtech_admin_pin');
      }
    } catch (e) {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    verifyPin(pin);
  };

  const handleLogout = () => {
    localStorage.removeItem('mtech_admin_pin');
    setIsAuthenticated(false);
    setData(null);
    setPin('');
  };

  const exportToCSV = () => {
    if (!data || !data.recentVisits.length) return;
    const headers = ['ID', 'Data/Hora', 'Caminho', 'Referenciador', 'Dispositivo', 'UTM Source', 'UTM Medium', 'UTM Campaign'];
    const rows = data.recentVisits.map(v => [
      v.id,
      new Date(v.timestamp).toLocaleString('pt-BR'),
      v.path,
      v.referrer || 'Direto',
      v.userAgent.includes('Mobi') ? 'Celular' : 'Desktop',
      v.utm_source || '',
      v.utm_medium || '',
      v.utm_campaign || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_mtech_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render da tela de login/PIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white px-4 relative overflow-hidden font-body">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md p-8 rounded-2xl border border-white/5 bg-[#161f30]/45 backdrop-blur-md shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(0,102,255,0.15)]">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-heading tracking-tight text-white mb-2">Painel M Tech</h1>
            <p className="text-sm text-slate-400">Insira seu PIN de acesso para visualizar o tráfego do site.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">PIN do Administrador</label>
              <input
                id="pin"
                type="password"
                placeholder="••••"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-black/40 border border-white/10 hover:border-blue-500/50 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white transition-all duration-300 placeholder:text-slate-600"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold font-heading py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                'Desbloquear Painel'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render do painel principal
  const summary = data!;
  
  // Calcular pontos para o SVG Chart
  const renderChart = () => {
    if (!summary.history || summary.history.length === 0) return null;
    
    const maxVal = Math.max(...summary.history.map(h => Math.max(h.pageViews, h.uniqueVisitors, 5)));
    const width = 800;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const pointsCount = summary.history.length;
    
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };
    
    const getY = (val: number) => {
      return paddingTop + chartHeight - (val / maxVal) * chartHeight;
    };

    // Construir os caminhos dos gráficos
    const pageViewPoints = summary.history.map((h, i) => `${getX(i)},${getY(h.pageViews)}`).join(' ');
    const uniquePoints = summary.history.map((h, i) => `${getX(i)},${getY(h.uniqueVisitors)}`).join(' ');

    const pageViewArea = `${getX(0)},${getY(0)} ` + pageViewPoints + ` ${getX(pointsCount - 1)},${getY(0)}`;
    const uniqueArea = `${getX(0)},${getY(0)} ` + uniquePoints + ` ${getX(pointsCount - 1)},${getY(0)}`;

    return (
      <div className="relative w-full h-[240px] overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pvGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="uvGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const labelValue = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx} className="opacity-20">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#fff" strokeWidth={1} strokeDasharray="4 4" />
                <text x={paddingLeft - 10} y={y + 4} fill="#94A3B8" fontSize={10} textAnchor="end">{labelValue}</text>
              </g>
            );
          })}

          {/* Area Fills */}
          {pointsCount > 1 && (
            <>
              <polygon points={pageViewArea} fill="url(#pvGlow)" />
              <polygon points={uniqueArea} fill="url(#uvGlow)" />
            </>
          )}

          {/* Lines */}
          {pointsCount > 1 && (
            <>
              <polyline fill="none" stroke="#0066FF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" points={pageViewPoints} className="drop-shadow-[0_2px_8px_rgba(0,102,255,0.4)]" />
              <polyline fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={uniquePoints} />
            </>
          )}

          {/* Pontos Interativos (Desenhar círculos apenas nos extremos e meio para não poluir) */}
          {summary.history.map((h, i) => {
            if (pointsCount > 15 && i % 2 !== 0 && i !== pointsCount - 1) return null;
            return (
              <g key={i} className="group cursor-pointer">
                <circle cx={getX(i)} cy={getY(h.pageViews)} r={4} fill="#0066FF" stroke="#fff" strokeWidth={1.5} />
                <circle cx={getX(i)} cy={getY(h.uniqueVisitors)} r={3} fill="#F59E0B" />
              </g>
            );
          })}

          {/* Eixo X - Datas formatadas */}
          {summary.history.map((h, i) => {
            if (pointsCount > 10 && i % Math.ceil(pointsCount / 6) !== 0 && i !== pointsCount - 1) return null;
            const d = new Date(h.date + 'T00:00:00');
            const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            return (
              <text key={i} x={getX(i)} y={height - 5} fill="#94A3B8" fontSize={9} textAnchor="middle" className="opacity-80">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] font-body pb-16">
      {/* Top Header */}
      <header className="sticky top-0 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-lg tracking-tight">
                M Tech <span className="text-blue-500">Analytics</span>
              </h1>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Monitorando em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 text-xs">
              {[7, 15, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    days === d 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Painel de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Page Views</span>
              <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-heading mb-1 text-white">{summary.totalPageViews}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Rastreamento ativo no domínio
            </p>
          </div>

          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Visitantes Únicos</span>
              <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-heading mb-1 text-white">{summary.uniqueVisitors}</div>
            <p className="text-xs text-slate-400">Com base no hash navegador/origem</p>
          </div>

          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Acessos Via Celular</span>
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-heading mb-1 text-white">
              {summary.recentVisits.length > 0 
                ? Math.round((summary.recentVisits.filter(v => v.userAgent.includes('Mobi')).length / Math.max(summary.recentVisits.length, 1)) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-slate-400">Proporção nas visitas recentes</p>
          </div>
        </div>

        {/* Gráfico de Acessos */}
        <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Tráfego de Acessos</h2>
              <p className="text-xs text-slate-400">Visualizações de página e visitantes únicos diários</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-blue-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Page Views
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Visitantes Únicos
              </span>
            </div>
          </div>
          {renderChart()}
        </div>

        {/* Detalhamento de Origens, Páginas e Campanhas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Páginas Mais Acessadas */}
          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Caminhos Mais Acessados
              </h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto max-h-[300px] pr-1">
              {Object.entries(summary.pages).length > 0 ? (
                Object.entries(summary.pages)
                  .sort((a, b) => b[1] - a[1])
                  .map(([path, count], idx) => (
                    <div key={path} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                      <span className="font-mono text-slate-300 truncate max-w-[200px]" title={path}>
                        {path}
                      </span>
                      <span className="bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                        {count} views
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">Nenhum dado registrado.</div>
              )}
            </div>
          </div>

          {/* Origem do Acesso (Referrers) */}
          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-500" />
                Origem do Acesso (Domínio)
              </h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto max-h-[300px] pr-1">
              {Object.entries(summary.referrers).length > 0 ? (
                Object.entries(summary.referrers)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ref, count]) => (
                    <div key={ref} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                      <span className="text-slate-300 truncate max-w-[200px]" title={ref}>
                        {ref}
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                        {count} acessos
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">Nenhum dado registrado.</div>
              )}
            </div>
          </div>

          {/* Campanhas UTM (Marketing) */}
          <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                Canais de Origem (UTM)
              </h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto max-h-[300px] pr-1">
              {Object.entries(summary.utmSources).length > 0 ? (
                Object.entries(summary.utmSources)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                      <span className="bg-amber-500/10 text-amber-500/90 font-semibold px-2 py-0.5 rounded-md font-mono text-[10px]">
                        utm_source={source}
                      </span>
                      <span className="text-slate-300 font-bold text-[11px]">
                        {count} leads
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-8">Nenhum tráfego UTM capturado.</div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico Recente de Visitas */}
        <div className="bg-[#161f30]/45 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="font-heading font-bold text-base text-white">Registro de Visitas Recentes</h3>
              <p className="text-xs text-slate-400">Últimos acessos monitorados em tempo real</p>
            </div>
            
            <button
              onClick={exportToCSV}
              disabled={!summary.recentVisits.length}
              className="flex items-center gap-2 bg-[#1e293b] hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-white/5 pb-2">
                  <th className="pb-3 font-semibold">Horário</th>
                  <th className="pb-3 font-semibold">Caminho</th>
                  <th className="pb-3 font-semibold">Origem (Referrer)</th>
                  <th className="pb-3 font-semibold">Campanha (UTM)</th>
                  <th className="pb-3 font-semibold">Dispositivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {summary.recentVisits.length > 0 ? (
                  summary.recentVisits.map((v) => {
                    const isMobile = v.userAgent.includes('Mobi');
                    return (
                      <tr key={v.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5">
                          {new Date(v.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-blue-400">
                          {v.path}
                        </td>
                        <td className="py-3.5 truncate max-w-[200px]" title={v.referrer}>
                          {v.referrer || <span className="text-slate-500">Direto / Link Direto</span>}
                        </td>
                        <td className="py-3.5">
                          {v.utm_source ? (
                            <span className="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {v.utm_source}
                              {v.utm_medium && ` / ${v.utm_medium}`}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className="flex items-center gap-1 text-slate-400">
                            {isMobile ? (
                              <>
                                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                                Celular
                              </>
                            ) : (
                              <>
                                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                                Desktop
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhuma visita registrada recentemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
