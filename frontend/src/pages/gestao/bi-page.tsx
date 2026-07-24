import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

export default function BiPage({ onBack }: { onBack: () => void }) {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [vpuData, setVpuData]         = useState<{ razao: string; qtdusers: number }[]>([]);
  const [gruposData, setGruposData]   = useState<{ grupo: string; total: number }[]>([]);
  const [faixasData, setFaixasData]   = useState<{ faixa: string; total: number }[]>([]);

  useEffect(() => {
    http.get<{ total_users: number }>('/api/gestao/bi/stats')
      .then(d => setTotalUsers(d.total_users))
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
                  <div style={{ width: `${Math.round((d.total / maxG) * 100)}%`, height: '100%', background: '#204294', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#204294', width: 30, textAlign: 'left', flexShrink: 0 }}>{d.total}</div>
              </div>
            ))}
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
        <KpiCard label="Serv. LINX VPU"  value="—" color="var(--ccm-blue)"    />
        <KpiCard label="Serv. CCM VPU"   value="—" color="var(--ccm-blue)"    />
        <KpiCard label="Oracle"          value="—" color="var(--ccm-ink)"     />
        <KpiCard label="SQL Server"      value="—" color="var(--ccm-ink)"     />
      </div>

      {/* Charts layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 14 }}>
        {/* Left: tall chart spanning 2 rows */}
        <div style={{ gridRow: '1 / 3' }}>
          <VpuChart />
        </div>
        {/* Top right: 2 charts */}
        <ChartBox title="Nº clientes / marcas" />
        <ChartBox title="Nº clientes / sistemas" />
        {/* Bottom right: 2 charts */}
        <GruposChart />
        <FaixasChart />
      </div>
    </div>
  );
}
