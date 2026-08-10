import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuthStore } from '../../store/auth-store';
import { http } from '../../lib/http-client';

const CCM_COLORS = { blue: '#204294', blueLight: '#00B0FA', teal: '#00C8B4', gray: '#C3C3C3' };



function KpiCard({ label, value, sub, borderColor, loading }: {
  label: string; value: string | number; sub: string; borderColor: string; loading?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '20px 22px', borderTop: `3px solid ${borderColor}`, boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {loading
          ? <span className="spinner-border spinner-border-sm" style={{ width: 20, height: 20 }} />
          : value}
      </div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [clientesAtivos,   setClientesAtivos]   = useState<number | null>(null);
  const [clientesCx,       setClientesCx]       = useState<number | null>(null);
  const [clientesPmo,      setClientesPmo]      = useState<number | null>(null);
  const [servidoresAtivos, setServidoresAtivos] = useState<number | null>(null);
  const [pendencias,       setPendencias]       = useState<number | null>(null);
  const [loadingA,   setLoadingA]   = useState(true);
  const [loadingCx,  setLoadingCx]  = useState(true);
  const [loadingPmo, setLoadingPmo] = useState(true);
  const [loadingSrv, setLoadingSrv] = useState(true);
  const [loadingPen, setLoadingPen] = useState(true);
  const [pendenciasAnalista, setPendenciasAnalista]   = useState<{ nome: string; valor: number }[]>([]);
  const [pendenciasStatus, setPendenciasStatus]     = useState<{ status: string; total: number }[]>([]);
  const [historico, setHistorico] = useState<{ data: string; agente_ia: number; humano: number }[]>([]);

  useEffect(() => {
    http.get<{ total: number }>('/api/dashboard/clientes-ativos')
      .then(r => setClientesAtivos(r.total)).catch(() => setClientesAtivos(null)).finally(() => setLoadingA(false));
    http.get<{ total: number }>('/api/dashboard/clientes-cx')
      .then(r => setClientesCx(r.total)).catch(() => setClientesCx(null)).finally(() => setLoadingCx(false));
    http.get<{ total: number }>('/api/dashboard/clientes-pmo')
      .then(r => setClientesPmo(r.total)).catch(() => setClientesPmo(null)).finally(() => setLoadingPmo(false));
    http.get<{ total: number }>('/api/dashboard/servidores-ativos')
      .then(r => setServidoresAtivos(r.total)).catch(() => setServidoresAtivos(null)).finally(() => setLoadingSrv(false));
    http.get<{ data: string; agente_ia: number; humano: number }[]>('/api/dashboard/historico-atualizacoes')
      .then(r => setHistorico(r)).catch(() => setHistorico([]));
    http.get<{ nome: string; valor: number }[]>('/api/dashboard/pendencias-por-analista')
      .then(r => setPendenciasAnalista(r)).catch(() => setPendenciasAnalista([]));
    http.get<{ status: string; total: number }[]>('/api/dashboard/pendencias-por-status')
      .then(setPendenciasStatus)
      .catch(() => {});
    http.get<{ total: number }>('/api/dashboard/pendencias-abertas')
      .then(r => setPendencias(r.total)).catch(() => setPendencias(null)).finally(() => setLoadingPen(false));
  }, []);

  return (
    <>
      <div className="mb-4">
        <div className="section-eyebrow">Bem-vindo de volta</div>
        <div className="section-title">{user?.name ?? 'Usuário'}</div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Clientes Ativos"
            value={clientesAtivos !== null ? clientesAtivos.toLocaleString('pt-BR') : '—'}
            sub="Ativos" borderColor="#1DB954" loading={loadingA} />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Clientes CX"
            value={clientesCx !== null ? clientesCx.toLocaleString('pt-BR') : '—'}
            sub="CX" borderColor="#00B0FA" loading={loadingCx} />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Clientes PMO"
            value={clientesPmo !== null ? clientesPmo.toLocaleString('pt-BR') : '—'}
            sub="PMO" borderColor="#F9E000" loading={loadingPmo} />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Servidores Ativos"
            value={servidoresAtivos !== null ? servidoresAtivos.toLocaleString('pt-BR') : '—'}
            sub="Servidores" borderColor="#7F77DD" loading={loadingSrv} />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Pendências"
            value={pendencias !== null ? pendencias.toLocaleString('pt-BR') : '—'}
            sub="Em aberto" borderColor="#E74C3C" loading={loadingPen} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="chart-card-title">Agendamento de Atualizações Linx — Agente IA vs Humano</div>
            {historico.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ccm-gray-dark)', fontSize: 13 }}>
                Sem dados de histórico disponíveis
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={historico} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke={CCM_COLORS.gray} strokeDasharray="3 3" />
                  <XAxis dataKey="data" tick={{ fontSize: 9, fill: '#4A4A4A' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4A4A4A' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C3C3C3', borderRadius: 4, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="agente_ia" stroke={CCM_COLORS.blueLight} strokeWidth={2} dot={{ r: 3 }} name="Agente IA" />
                  <Line type="monotone" dataKey="humano"    stroke={CCM_COLORS.blue}      strokeWidth={2} dot={{ r: 3 }} name="Humano" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="chart-card-title">Pendências por Analista — Em Aberto</div>
            {pendenciasAnalista.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ccm-gray-dark)', fontSize: 13 }}>
                Nenhuma pendência em aberto
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pendenciasAnalista} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke={CCM_COLORS.gray} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#4A4A4A' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4A4A4A' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C3C3C3', borderRadius: 4, fontSize: 12 }}
                    formatter={(v: number) => [v, 'Pendências']} />
                  <Bar dataKey="valor" fill="#E74C3C" radius={[3, 3, 0, 0]} name="Pendências" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="chart-card-title">Pendências por Status</div>
            {pendenciasStatus.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ccm-gray-dark)', fontSize: 13 }}>
                Nenhuma pendência em aberto
              </div>
            ) : (() => {
              const COLORS = ['#1DB954','#F9A825','#00B0FA','#E74C3C','#7F77DD','#204294'];
              const total = pendenciasStatus.reduce((s, d) => s + d.total, 0);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pendenciasStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {pendenciasStatus.map((_entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Pendências']} contentStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
                    {pendenciasStatus.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--ccm-gray-dark)', textTransform: 'capitalize' }}>{d.status}</span>
                        <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>{d.total}</span>
                        <span style={{ color: 'var(--ccm-gray-medium)' }}>({Math.round((d.total/total)*100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
