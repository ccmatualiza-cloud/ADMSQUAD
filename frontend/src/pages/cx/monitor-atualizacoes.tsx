import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

interface Stats {
  total: number;
  pct_nao_iniciado: number;
  pct_em_andamento: number;
  pct_concluido: number;
  nao_iniciado: number;
  em_andamento: number;
  concluido_count: number;
}

interface Atualizacao {
  cod: number | null;
  razao: string | null;
  sistema: string | null;
  bd: string | null;
  versao: string | null;
  ticketupdate: string | null;
  tipo: string | null;
  pacote: string | null;
  useragend: string | null;
  prioridade: number | null;
  horaupdate: string | null;
  concluido: string | number | null;
  email_enviado: number | null;
  dt_atualiza: string | null;
}

function concluidoStyle(val: string | number | null): React.CSSProperties {
  const v = String(val ?? '0').trim();
  if (v === '100') return { background: '#1DB954', color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12, display: 'inline-block' };
  if (v === '98')  return { background: '#E74C3C', color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12, display: 'inline-block' };
  if (v === '0' || v === '')  return { background: '#fff', color: '#333', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12, display: 'inline-block', border: '1px solid #ddd' };
  return { background: '#F9E000', color: '#5a4000', borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 12, display: 'inline-block' };
}

function getTodayBR(): string {
  const d = new Date();
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function StatCard({ label, value, sub, borderColor, loading }: {
  label: string; value: string; sub: string; borderColor: string; loading?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '18px 20px', borderTop: `3px solid ${borderColor}`, boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--ccm-gray-dark)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ccm-ink)', lineHeight: 1 }}>
        {loading ? <span className="spinner-border spinner-border-sm" style={{ width: 20, height: 20 }} /> : value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ccm-gray-medium)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function MonitorAtualizacoes({ onBack }: { onBack: () => void }) {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [items, setItems]     = useState<Atualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        http.get<Stats>('/api/cx/atualizacoes/stats'),
        http.get<Atualizacao[]>('/api/cx/atualizacoes'),
      ]);
      setStats(s);

      const hoje = getTodayBR();

      const updated = await Promise.all(d.map(async (item) => {
        const concluido  = String(item.concluido ?? '').trim();
        const pacote     = (item.pacote ?? '').toUpperCase();
        const dtAtualize = (item.dt_atualiza ?? '').trim();
        const isHoje     = dtAtualize === hoje;
        const isWeb      = pacote === 'WEB' || pacote === 'DMSWEB';
        const elegivel   = concluido === '100' && isHoje && !isWeb && ['EVO','ESS','ESP'].includes(pacote);
        const jaEnviou   = (item.email_enviado ?? 0) !== 0;

        if (elegivel && !jaEnviou && item.cod) {
          try {
            await http.post(`/api/cx/consultar-atualizacao/${item.cod}/enviar-email`, {});
            await http.put(`/api/cx/atualizacoes/${item.cod}/email-status?status_val=1`, {});
            return { ...item, email_enviado: 1 };
          } catch {
            await http.put(`/api/cx/atualizacoes/${item.cod}/email-status?status_val=2`, {});
            return { ...item, email_enviado: 2 };
          }
        }
        return item;
      }));

      setItems(updated);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const filtered = items;

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  const emailIcon = (item: Atualizacao) => {
    const concluido = String(item.concluido ?? '').trim();
    const pacote    = (item.pacote ?? '').toUpperCase();
    const isWeb     = pacote === 'WEB' || pacote === 'DMSWEB';
    const is100     = concluido === '100';

    if (!is100) {
      return <span title="Aguardando conclusão" style={{ color: '#ccc', fontSize: 16 }}><i className="bi bi-circle" /></span>;
    }
    if (isWeb) {
      return <span title="WEB — sem envio de email" style={{ color: '#aaa', fontSize: 16 }}><i className="bi bi-dash-circle-fill" /></span>;
    }
    if ((item.email_enviado ?? 0) === 1) {
      return <span title="Email enviado com sucesso" style={{ color: '#1DB954', fontSize: 16 }}><i className="bi bi-check-circle-fill" /></span>;
    }
    if ((item.email_enviado ?? 0) === 2) {
      return <span title="Erro no envio do email" style={{ color: '#E74C3C', fontSize: 16 }}><i className="bi bi-x-circle-fill" /></span>;
    }
    return <span title="Aguardando envio" style={{ color: '#ccc', fontSize: 16 }}><i className="bi bi-circle" /></span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Monitor de Atualizações</span>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Total Agendado" value={String(stats?.total ?? 0)} sub="Atualizações hoje" borderColor="var(--ccm-blue)" loading={loading} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Não Iniciado" value={`${stats?.pct_nao_iniciado ?? 0}%`} sub={`${stats?.nao_iniciado ?? 0} registros`} borderColor="#C3C3C3" loading={loading} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Em Andamento" value={`${stats?.pct_em_andamento ?? 0}%`} sub={`${stats?.em_andamento ?? 0} registros`} borderColor="#F9E000" loading={loading} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Concluído" value={`${stats?.pct_concluido ?? 0}%`} sub={`${stats?.concluido_count ?? 0} registros`}
            borderColor={stats?.pct_concluido !== undefined && stats.pct_concluido >= 98 && stats.pct_concluido < 100 ? '#E74C3C' : '#1DB954'} loading={loading} />
        </div>
      </div>

      <div className="table-card">
        <div style={{ overflowX: 'auto', borderRadius: '6px 6px 0 0' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <i className="bi bi-calendar-check" style={{ fontSize: 32, display: 'block', marginBottom: 12, color: 'var(--ccm-gray-medium)' }} />
              Nenhuma atualização agendada para hoje
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Razão Social</th>
                  <th style={th}>Sistema</th>
                  <th style={th}>BD</th>
                  <th style={th}>Versão</th>
                  <th style={th}>Ticket</th>
                  <th style={{ ...th, textAlign: 'center' }}>Tipo</th>
                  <th style={th}>Pacote</th>
                  <th style={th}>Agendado</th>
                  <th style={{ ...th, textAlign: 'center' }}>P</th>
                  <th style={th}>Hora</th>
                  <th style={{ ...th, textAlign: 'center' }}>%</th>
                  <th style={{ ...th, textAlign: 'center' }}><i className="bi bi-envelope-fill" style={{ fontSize: 13 }} /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.cod ?? i} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.razao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{item.sistema || '—'}</td>
                    <td style={td}>{item.bd || '—'}</td>
                    <td style={td}>{item.versao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)' }}>{item.ticketupdate || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{item.tipo || '—'}</td>
                    <td style={td}>{item.pacote || '—'}</td>
                    <td style={td}>{item.useragend ? item.useragend.toUpperCase() : '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{item.prioridade ?? '—'}</td>
                    <td style={td}>{item.horaupdate || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={concluidoStyle(item.concluido)}>{String(item.concluido ?? '0').trim()}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {emailIcon(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
