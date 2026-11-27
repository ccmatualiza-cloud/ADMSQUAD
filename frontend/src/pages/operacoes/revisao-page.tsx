import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

type ReviewAction = 'pmp' | 'oci' | 'db' | 'ok' | 'clear';
type ReviewFilter = '' | 'pending' | 'in_review' | 'ok';

interface RevisaoItem {
  cod: number;
  razao: string | null;
  cliente: string | null;
  sistema: string | null;
  qtdusers: number | null;
  qtdusersts: number | null;
  grupo: string | null;
  detalhes: string | null;
}

const REVISAO_COLOR = '#E67E22';

const ACTIONS: { action: ReviewAction; label: string; bg: string; color: string; icon?: string; title: string }[] = [
  { action: 'pmp',   label: 'PMP',    bg: '#204294', color: '#fff', title: 'Incluir PMP em Detalhes' },
  { action: 'oci',   label: 'OCI',    bg: '#C74634', color: '#fff', title: 'Incluir OCI em Detalhes' },
  { action: 'db',    label: 'DB',     bg: '#7F77DD', color: '#fff', title: 'Incluir DB em Detalhes' },
  { action: 'ok',    label: 'OK',     bg: '#1DB954', color: '#fff', icon: 'bi-check-lg', title: 'Marcar como OK (substitui Detalhes)' },
  { action: 'clear', label: 'Limpar', bg: '#fff',    color: 'var(--ccm-gray-dark)', icon: 'bi-eraser', title: 'Limpar Detalhes' },
];

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  PMP: { bg: '#E8EDF7', color: '#204294' },
  OCI: { bg: '#FBEAE8', color: '#C74634' },
  DB:  { bg: '#F0EFFE', color: '#5B53C2' },
  OK:  { bg: '#E3F8EA', color: '#138A3E' },
};

const FILTER_LABELS: Record<Exclude<ReviewFilter, ''>, string> = {
  pending: 'Sem revisão',
  in_review: 'Em revisão',
  ok: 'OK',
};

function splitTags(detalhes: string | null): string[] {
  return (detalhes ?? '').split('-').map(t => t.trim()).filter(Boolean);
}

function reviewState(detalhes: string | null): Exclude<ReviewFilter, ''> {
  const tags = splitTags(detalhes);
  if (tags.length === 0) return 'pending';
  if (tags.length === 1 && tags[0].toUpperCase() === 'OK') return 'ok';
  return 'in_review';
}

export default function RevisaoPage({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<RevisaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReviewFilter>('');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchData = async (q = search) => {
    setLoading(true);
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      setItems(await http.get<RevisaoItem[]>(`/api/revisao/${params}`));
    } catch {
      toast.error('Erro ao carregar clientes cancelados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { pending: 0, in_review: 0, ok: 0 };
    items.forEach(i => { c[reviewState(i.detalhes)] += 1; });
    return c;
  }, [items]);

  const filtered = filter ? items.filter(i => reviewState(i.detalhes) === filter) : items;

  const runAction = async (item: RevisaoItem, action: ReviewAction) => {
    setBusy(`${item.cod}:${action}`);
    try {
      const res = await http.put<{ cod: number; detalhes: string | null }>(`/api/revisao/${item.cod}/action`, { action });
      setItems(prev => prev.map(i => (i.cod === item.cod ? { ...i, detalhes: res.detalhes } : i)));
    } catch {
      toast.error('Erro ao atualizar Detalhes');
    } finally {
      setBusy(null);
    }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  const summary: { key: ReviewFilter; label: string; value: number; color: string }[] = [
    { key: '',          label: 'Total cancelados', value: items.length,     color: 'var(--ccm-ink)' },
    { key: 'pending',   label: 'Sem revisão',      value: counts.pending,   color: '#E74C3C' },
    { key: 'in_review', label: 'Em revisão',       value: counts.in_review, color: REVISAO_COLOR },
    { key: 'ok',        label: 'OK',               value: counts.ok,        color: '#1DB954' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Revisão</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Revisão de Clientes Cancelados</div>

      <div className="row g-3 mb-3">
        {summary.map(s => {
          const active = filter === s.key && s.key !== '';
          return (
            <div key={s.label} className="col-6 col-md-3">
              <div onClick={() => setFilter(active || s.key === '' ? '' : s.key)}
                style={{ background: '#fff', border: `1px solid ${active ? s.color : 'var(--ccm-line)'}`, borderTop: `3px solid ${s.color}`, borderRadius: 6, padding: '14px 18px', cursor: 'pointer', boxShadow: active ? '0 4px 16px rgba(12,25,33,.15)' : '0 1px 4px rgba(12,25,33,.07)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ccm-gray-dark)', textTransform: 'uppercase', letterSpacing: '.14em' }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{loading ? '–' : s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: '6px 6px 0 0' }}>
          <i className="bi bi-person-x-fill" style={{ color: REVISAO_COLOR, fontSize: 16 }} />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
            {loading ? 'Carregando...' : `${filtered.length} cliente(s) — 9 - INATIVO`}
          </span>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, cliente, sistema, grupo..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            style={{ maxWidth: 360, fontSize: 13 }} />
          <select className="form-select" value={filter} onChange={e => setFilter(e.target.value as ReviewFilter)} style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todas as revisões</option>
            {(Object.keys(FILTER_LABELS) as Exclude<ReviewFilter, ''>[]).map(k => <option key={k} value={k}>{FILTER_LABELS[k]}</option>)}
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData()}>
            <i className="bi bi-search me-1" />Buscar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Razão</th>
                  <th style={th}>Cliente</th>
                  <th style={th}>Sistema</th>
                  <th style={{ ...th, textAlign: 'center' }}>Qtd Users</th>
                  <th style={{ ...th, textAlign: 'center' }}>Qtd Users TS</th>
                  <th style={th}>Grupo</th>
                  <th style={th}>Detalhes</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente cancelado encontrado</td></tr>
                ) : filtered.map((item, i) => {
                  const tags = splitTags(item.detalhes);
                  return (
                    <tr key={item.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.razao ?? ''}>{item.razao || '—'}</td>
                      <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.cliente ?? ''}>{item.cliente || '—'}</td>
                      <td style={td}>{item.sistema || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{item.qtdusers ?? '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{item.qtdusersts ?? '—'}</td>
                      <td style={td}>{item.grupo || '—'}</td>
                      <td style={td}>
                        {tags.length === 0 ? <span style={{ color: 'var(--ccm-gray-medium)' }}>—</span> : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {tags.map(t => {
                              const st = TAG_STYLE[t.toUpperCase()] ?? { bg: '#EEF0F3', color: 'var(--ccm-gray-dark)' };
                              return <span key={t} style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{t}</span>;
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {ACTIONS.map(a => (
                            <button key={a.action} className="btn btn-sm" title={a.title}
                              disabled={busy !== null && busy.startsWith(`${item.cod}:`)}
                              style={{ background: a.bg, color: a.color, fontSize: 10, fontWeight: 700, padding: '3px 9px', border: a.action === 'clear' ? '1px solid var(--ccm-line)' : 'none' }}
                              onClick={() => runAction(item, a.action)}>
                              {busy === `${item.cod}:${a.action}`
                                ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                : <>{a.icon && <i className={`bi ${a.icon} me-1`} />}{a.label}</>}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
