import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

export default function BiPage({ onBack }: { onBack: () => void }) {
  const [totalUsers, setTotalUsers]   = useState<number | null>(null);
  const [oracleCount, setOracleCount]       = useState<number | null>(null);
  const [sqlserverCount, setSqlserverCount] = useState<number | null>(null);
  const [vpuData, setVpuData]         = useState<{ razao: string; qtdusers: number }[]>([]);
  const [gruposData, setGruposData]   = useState<{ grupo: string; total: number }[]>([]);
  const [faixasData, setFaixasData]     = useState<{ faixa: string; total: number }[]>([]);
  const [sistemasData, setSistemasData]     = useState<{ sistema: string; total: number }[]>([]);
  const [ccmVpu, setCcmVpu]                 = useState<number | null>(null);
  const [linxAtivo, setLinxAtivo]           = useState<number | null>(null);
  const [atualizData, setAtualizData]       = useState<{ data: string; total: number }[]>([]);

  useEffect(() => {
    http.get<{ total_users: number; oracle_count: number; sqlserver_count: number; ccm_vpu: number; linx_ativo: number }>('/api/gestao/bi/stats')
      .then(d => { setTotalUsers(d.total_users); setOracleCount(d.oracle_count); setSqlserverCount(d.sqlserver_count); setCcmVpu(d.ccm_vpu); setLinxAtivo(d.linx_ativo); })
      .catch(() => {});
    http.get<{ razao: string; qtdusers: number }[]>('/api/gestao/bi/vpu-users')
      .then(setVpuData)
      .catch(() => {});
    http.get<{ grupo: string; total: number }[]>('/api/gestao/bi/grupos-atualizacao')
      .then(setGruposData)
      .catch(() => {});
    http.get<{ faixa: string; total: number }[]>('/api/gestao/bi/faixas-users')
      .then(setFaixasData)
      .catch(() => {});
    http.get<{ sistema: string; total: number }[]>('/api/gestao/bi/sistemas')
      .then(setSistemasData)
      .catch(() => {});
    http.get<{ data: string; total: number }[]>('/api/gestao/bi/atualizacoes')
      .then(setAtualizData)
      .catch(() => {});
  }, []);



  const KpiCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 6, padding: '14px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ccm-gray-dark)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
    </div>
  );

  const VpuChart = () => {
    const max = vpuData.length > 0 ? vpuData[0].qtdusers : 1;
    return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>Maiores clientes VPU — nº users</div>
        {vpuData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: '#F7F8FA', borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}><i className="bi bi-bar-chart me-2" />Carregando...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 440 }}>
            {vpuData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--ccm-gray-dark)', width: 140, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.razao}>
                  {d.razao}
                </div>
                <div style={{ flex: 1, height: 10, background: '#F0F4FA', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((d.qtdusers / max) * 100)}%`, height: '100%', background: 'var(--ccm-blue)', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ccm-blue)', width: 34, textAlign: 'left', flexShrink: 0 }}>
                  {d.qtdusers >= 1000 ? `${(d.qtdusers / 1000).toFixed(1)}K` : d.qtdusers}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const GruposChart = () => {
    const maxG = gruposData.length > 0 ? gruposData[0].total : 1;
    return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>Grupos de atualização</div>
        {gruposData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, background: '#F7F8FA', borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}><i className="bi bi-bar-chart me-2" />Carregando...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {gruposData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--ccm-gray-dark)', width: 60, textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>{d.grupo}</div>
                <div style={{ flex: 1, height: 16, background: '#F0F4FA', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((d.total / maxG) * 100)}%`, height: '100%', background: '#7F77DD', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#204294', width: 30, textAlign: 'left', flexShrink: 0 }}>{d.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AtualizacoesChart = () => {
    if (atualizData.length === 0) return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>Quantidade de atualizações</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, background: '#F7F8FA', borderRadius: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>Carregando...</span>
        </div>
      </div>
    );
    const W = 360, H = 160, PAD = { t: 12, r: 8, b: 36, l: 30 };
    const maxV = Math.max(...atualizData.map(d => d.total), 1);
    const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
    const n = atualizData.length;
    const pts = atualizData.map((d, i) => ({
      x: PAD.l + (i / (n - 1 || 1)) * iW,
      y: PAD.t + iH - (d.total / maxV) * iH,
      ...d
    }));
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const lastPt = pts[pts.length - 1];
    const area = lastPt ? `${path} L${lastPt.x} ${PAD.t+iH} L${PAD.l} ${PAD.t+iH} Z` : '';
    const step = Math.max(1, Math.floor(n / 6));
    return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>Quantidade de atualizações</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
          {/* grid lines */}
          {[0,.25,.5,.75,1].map((f,i) => (
            <line key={i} x1={PAD.l} x2={W-PAD.r} y1={PAD.t+iH*(1-f)} y2={PAD.t+iH*(1-f)} stroke="#F0F0F0" strokeWidth={1} />
          ))}
          {/* area */}
          <path d={area} fill="rgba(0,176,250,0.12)" />
          {/* line */}
          <path d={path} fill="none" stroke="#00B0FA" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* dots */}
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00B0FA" />)}
          {/* x labels */}
          {pts.filter((_, i) => i % step === 0 || i === n-1).map((p, i) => (
            <text key={i} x={p.x} y={H-4} textAnchor="middle" fontSize="7" fill="#9BA4AB">
              {p.data.substring(0,5)}
            </text>
          ))}
          {/* y labels */}
          {[0,.5,1].map((f,i) => (
            <text key={i} x={PAD.l-4} y={PAD.t+iH*(1-f)+3} textAnchor="end" fontSize="8" fill="#9BA4AB">
              {Math.round(maxV*f)}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  const SistemasChart = () => {
    const COLORS = ['#00B0FA','#204294','#7F77DD','#1DB954','#F9A825','#E74C3C','#25D366','#F97316','#0EA5E9','#8B5CF6','#EC4899','#14B8A6'];
    const total = sistemasData.reduce((s, d) => s + d.total, 0);
    const SIZE = 150;
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 8, ri = r * 0.52;

    let cumulAngle = -Math.PI / 2;
    const slices = sistemasData.map((d, i) => {
      const angle = (d.total / total) * 2 * Math.PI;
      const startA = cumulAngle;
      cumulAngle += angle;
      const endA = cumulAngle;
      const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
      const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
      const xi1 = cx + ri * Math.cos(startA), yi1 = cy + ri * Math.sin(startA);
      const xi2 = cx + ri * Math.cos(endA),   yi2 = cy + ri * Math.sin(endA);
      const large = angle > Math.PI ? 1 : 0;
      const path = `M${xi1} ${yi1} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${ri} ${ri} 0 ${large} 0 ${xi1} ${yi1} Z`;
      const pct = Math.round((d.total / total) * 100);
      return { ...d, path, color: COLORS[i % COLORS.length], pct };
    });

    return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>Nº clientes / sistemas</div>
        {sistemasData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, background: '#F7F8FA', borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>Carregando...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
              {slices.map((s, i) => (
                <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1.5} />
              ))}
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a2e3e">{total}</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#9BA4AB">clientes</text>
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 160 }}>
              {slices.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: 'var(--ccm-gray-dark)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sistema}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.total}</div>
                  <div style={{ fontSize: 9, color: 'var(--ccm-gray-medium)', flexShrink: 0 }}>({s.pct}%)</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const FaixasChart = () => {
    const maxF = faixasData.length > 0 ? Math.max(...faixasData.map(d => d.total)) : 1;
    return (
      <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 16 }}>Grupos por quantidade de users</div>
        {faixasData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, background: '#F7F8FA', borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}><i className="bi bi-bar-chart me-2" />Carregando...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faixasData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ccm-gray-dark)', width: 65, textAlign: 'right', flexShrink: 0 }}>{d.faixa}</div>
                <div style={{ flex: 1, height: 22, background: '#EBF5FB', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.round((d.total / maxF) * 100)}%`, height: '100%', background: '#00B0FA', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8, transition: 'width .4s ease' }}>
                    {d.total > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.total}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#00B0FA', width: 28, flexShrink: 0 }}>{d.total === 0 ? '0' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ChartBox = ({ title }: { title: string }) => (
    <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>{title}</div>
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', borderRadius: 4, border: '1px dashed var(--ccm-line)' }}>
        <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>
          <i className="bi bi-bar-chart me-2" />Gráfico em breve
        </span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>B.I. — Estatísticas de Squad</span>
      </div>



      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Total de Users"   value={totalUsers !== null ? totalUsers.toLocaleString('pt-BR') : '…'} color="var(--ccm-blue)"    />
        <KpiCard label="Clientes Ativos"  value="—" color="#1DB954"             />
        <KpiCard label="Cancelados"       value="—" color="#E74C3C"             />
        <KpiCard label="Serv. LINX VPU"  value={linxAtivo !== null ? linxAtivo.toLocaleString('pt-BR') : '…'} color="var(--ccm-blue)" />
        <KpiCard label="Serv. CCM VPU"   value={ccmVpu !== null ? ccmVpu.toLocaleString('pt-BR') : '…'} color="var(--ccm-blue)" />
        <KpiCard label="Oracle"          value={oracleCount !== null ? oracleCount.toLocaleString('pt-BR') : '…'} color="#CC0000" />
        <KpiCard label="SQL Server"      value={sqlserverCount !== null ? sqlserverCount.toLocaleString('pt-BR') : '…'} color="#F9A825" />
      </div>

      {/* Charts layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 14 }}>
        {/* Left: tall chart spanning 2 rows */}
        <div style={{ gridRow: '1 / 3' }}>
          <VpuChart />
        </div>
        {/* Top right: 2 charts */}
        <AtualizacoesChart />
        <SistemasChart />
        {/* Bottom right: 2 charts */}
        <GruposChart />
        <FaixasChart />
      </div>
    </div>
  );
}
