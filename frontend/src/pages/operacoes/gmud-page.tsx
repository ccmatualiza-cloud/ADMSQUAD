import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import GmudFormModal from './gmud-form-modal';
import { openGmudPrintWindow, writeGmudPdf } from './gmud-pdf';
import {
  CHANGE_TYPE_LABELS, GMUD_COLOR, PRIORITY_COLOR, PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER, STATUS_STYLE,
  formatDateBr, formatGmudNumber, type Gmud, type GmudListItem, type GmudStatus,
} from './gmud-types';

export default function GmudPage({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<GmudListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GmudStatus | ''>('');
  const [modal, setModal] = useState<{ gmud: Gmud | null } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchData = async (q = search) => {
    setLoading(true);
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      setItems(await http.get<GmudListItem[]>(`/api/gmud/${params}`));
    } catch {
      toast.error('Erro ao carregar GMUDs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c: Record<GmudStatus, number> = { open: 0, paused: 0, cancelled: 0, completed: 0 };
    items.forEach(i => { if (i.status in c) c[i.status] += 1; });
    return c;
  }, [items]);

  const filtered = statusFilter ? items.filter(i => i.status === statusFilter) : items;

  const openEdit = async (id: number) => {
    setBusyId(id);
    try {
      setModal({ gmud: await http.get<Gmud>(`/api/gmud/${id}`) });
    } catch {
      toast.error('Erro ao abrir GMUD');
    } finally {
      setBusyId(null);
    }
  };

  const generatePdf = async (id: number) => {
    const win = openGmudPrintWindow();
    if (!win) { toast.error('O navegador bloqueou a janela. Libere pop-ups para o Admsquad.'); return; }
    try {
      writeGmudPdf(win, await http.get<Gmud>(`/api/gmud/${id}`));
    } catch {
      win.close();
      toast.error('Erro ao gerar o PDF da GMUD');
    }
  };

  const changeStatus = async (item: GmudListItem, status: GmudStatus) => {
    if (status === item.status) return;
    try {
      await http.put(`/api/gmud/${item.id}/status`, { status });
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status } : i)));
      toast.success(`GMUD ${formatGmudNumber(item.number)}: ${STATUS_LABELS[status]}`);
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>GMUD</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Gestão de Mudanças</div>

      <div className="row g-3 mb-3">
        {STATUS_ORDER.map(s => {
          const st = STATUS_STYLE[s];
          const active = statusFilter === s;
          return (
            <div key={s} className="col-6 col-md-3">
              <div onClick={() => setStatusFilter(active ? '' : s)}
                style={{ background: '#fff', border: `1px solid ${active ? st.accent : 'var(--ccm-line)'}`, borderTop: `3px solid ${st.accent}`, borderRadius: 6, padding: '14px 18px', cursor: 'pointer', boxShadow: active ? `0 4px 16px ${st.accent}44` : '0 1px 4px rgba(12,25,33,.07)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ccm-gray-dark)', textTransform: 'uppercase', letterSpacing: '.14em' }}>{STATUS_LABELS[s]}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: st.color, lineHeight: 1.2 }}>{loading ? '–' : counts[s]}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-clipboard2-check" style={{ color: GMUD_COLOR, fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} GMUD(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => setModal({ gmud: null })}>
            <i className="bi bi-plus-lg me-1" />Nova GMUD
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar por nº, projeto, solicitante, atividade..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            style={{ maxWidth: 360, fontSize: 13 }} />
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as GmudStatus | '')} style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
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
                  <th style={th}>Nº</th>
                  <th style={th}>Projeto</th>
                  <th style={th}>Solicitante</th>
                  <th style={th}>Data</th>
                  <th style={th}>Prioridade</th>
                  <th style={th}>Natureza</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma GMUD encontrada</td></tr>
                ) : filtered.map((item, i) => {
                  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.open;
                  return (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 700 }}>{formatGmudNumber(item.number)}</td>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.project_name}>{item.project_name}</td>
                      <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.requester || '—'}</td>
                      <td style={td}>{formatDateBr(item.request_date)}</td>
                      <td style={td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 99, background: PRIORITY_COLOR[item.priority] }} />
                          {PRIORITY_LABELS[item.priority] ?? item.priority}
                        </span>
                      </td>
                      <td style={td}>{CHANGE_TYPE_LABELS[item.change_type] ?? item.change_type}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <select value={item.status} onChange={e => changeStatus(item, e.target.value as GmudStatus)}
                          style={{ background: st.bg, color: st.color, border: 'none', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" disabled={busyId === item.id} style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(item.id)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => generatePdf(item.id)}>
                            <i className="bi bi-file-earmark-pdf-fill me-1" />Gerar PDF
                          </button>
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

      {modal && (
        <GmudFormModal
          gmud={modal.gmud}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
