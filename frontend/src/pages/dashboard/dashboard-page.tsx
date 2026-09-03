import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

interface AtividadeHoje {
  analista: string; cliente: string; ticketproj: string | null;
  atividade: string | null; tipoatividade: string | null;
  horainicio: string | null; horafim: string | null;
  duracao: string | null; status: string;
}

interface AusenciaItem {
  colaborador: string; tipo: string; data_ini: string; hora_ini: string;
  data_fim: string; hora_fim: string; area: string | null; depto: string | null;
}
import { useAuthStore } from '../../store/auth-store';
import { http } from '../../lib/http-client';

const CCM_COLORS = { blue: '#204294', blueLight: '#00B0FA', teal: '#00C8B4', gray: '#C3C3C3' };



function KpiCard({ label, value, sub, borderColor, loading }: {
  label: string; value: string | number; sub: string; borderColor: string; loading?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '7px 14px', borderTop: `3px solid ${borderColor}`, boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}>
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
  const [ausencias, setAusencias]       = useState<AusenciaItem[]>([]);
  const [atividadesHoje, setAtividadesHoje] = useState<AtividadeHoje[]>([]);
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
    http.get<AusenciaItem[]>('/api/dashboard/ausencias-proximas')
      .then(setAusencias)
      .catch(() => {});
    http.get<AtividadeHoje[]>('/api/dashboard/atividades-hoje')
      .then(setAtividadesHoje)
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
            <div className="chart-card-title">Pendências por Analista</div>
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
      {/* Ausências próximos 7 dias */}
      <div className="row g-3" style={{ marginTop: 4 }}>
        <div className="col-12 col-lg-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="chart-card-title" style={{ marginBottom: 12, fontSize: 12 }}>
              <i className="bi bi-calendar-x me-1" style={{ color: '#F9A825' }} />
              Ausências — Próximos 7 dias
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ccm-gray-medium)', marginLeft: 6 }}>({ausencias.length})</span>
            </div>
            {ausencias.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--ccm-gray-medium)', fontSize: 11 }}>
                <i className="bi bi-check-circle me-1" style={{ color: '#1DB954' }} />
                Nenhuma ausência nos próximos 7 dias
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ausencias.map((a, i) => {
                  const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
                    'Férias':                 { bg: '#E8F7FF', color: '#00B0FA' },
                    'Banco de Horas':         { bg: '#FFF8E1', color: '#F9A825' },
                    'Licença Médica':         { bg: '#FDDEDE', color: '#E74C3C' },
                    'Abono':                  { bg: '#E8EDF7', color: '#204294' },
                    'Day Off':                { bg: '#D4F5E2', color: '#0E7E3B' },
                    'Ausência Justificada':   { bg: '#F0EFFE', color: '#7F77DD' },
                    'Ausência Injustificada': { bg: '#FDDEDE', color: '#9B2020' },
                  };
                  const tc = TIPO_COLORS[a.tipo] ?? { bg: '#F5F5F5', color: '#888' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#F7F8FA', borderRadius: 6, border: '1px solid var(--ccm-line)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8EDF7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="bi bi-person-fill" style={{ color: '#204294', fontSize: 13 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ccm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.colaborador}</div>
                        <div style={{ fontSize: 10, color: 'var(--ccm-gray-dark)' }}>{a.area || '—'}</div>
                      </div>
                      <span style={{ background: tc.bg, color: tc.color, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.tipo}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ccm-gray-dark)', flexShrink: 0 }}>
                        <i className="bi bi-calendar3" style={{ color: '#204294', fontSize: 11 }} />
                        <span>{a.data_ini}{a.data_fim && a.data_fim !== a.data_ini ? <> <span style={{ color: '#b0b8c1' }}>até</span> {a.data_fim}</> : ''}</span>
                      </div>
                      {(a.hora_ini || a.hora_fim) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ccm-gray-dark)', flexShrink: 0 }}>
                          <i className="bi bi-clock" style={{ fontSize: 11, color: '#204294' }} />
                          <span>{a.hora_ini}{a.hora_fim ? ` - ${a.hora_fim}` : ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="chart-card-title" style={{ marginBottom: 12, fontSize: 12 }}>
              <i className="bi bi-activity me-1" style={{ color: '#1DB954' }} />
              Atividades Fora de Horário — de Hoje
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ccm-gray-medium)', marginLeft: 6 }}>({atividadesHoje.length})</span>
            </div>
            {atividadesHoje.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--ccm-gray-medium)', fontSize: 11 }}>
                Nenhuma atividade registrada hoje
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {atividadesHoje.map((a, i) => {
                  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
                    'Aberto':       { bg: '#E8EDF7', color: '#204294' },
                    'Em Andamento': { bg: '#FFF8CC', color: '#8A6800' },
                    'Concluido':    { bg: '#D4F5E2', color: '#0E7E3B' },
                    'Cancelado':    { bg: '#FDDEDE', color: '#9B2020' },
                  };
                  const sc = STATUS_COLORS[a.status] ?? { bg: '#eee', color: '#888' };
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', alignItems: 'center', gap: 10, padding: '6px 10px', background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderRadius: 6, border: '1px solid var(--ccm-line)' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--ccm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.analista}</div>
                      <div style={{ fontSize: 11, color: 'var(--ccm-gray-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.cliente}</div>
                      <div style={{ fontSize: 10, color: '#7F77DD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.atividade || '—'}</div>
                      <span style={{ fontSize: 9, color: '#00B0FA', fontWeight: 700, background: '#E8F7FF', borderRadius: 99, padding: '1px 6px', whiteSpace: 'nowrap' }}>
                        {a.ticketproj ? `#${a.ticketproj}` : '—'}
                      </span>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '1px 7px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
