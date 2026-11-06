import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Pendencia {
  id: number; cliente: string; ticket: string; descritivo: string; tratativa: string | null;
  analista: string; status: string; data: string; data_limite: string | null; dias: number | null;
}

type ColumnKey = 'aberto' | 'em_andamento' | 'impedimento' | 'resolvido';

const COLUMNS: { key: ColumnKey; title: string; color: string; tint: string; icon: string }[] = [
  { key: 'aberto',       title: 'Aberto',      color: '#F9A825', tint: '#FFF8E1', icon: 'bi-inbox-fill' },
  { key: 'em_andamento', title: 'Andamento',   color: '#00B0FA', tint: '#E8F7FF', icon: 'bi-play-circle-fill' },
  { key: 'impedimento',  title: 'Impedimento', color: '#E74C3C', tint: '#FDECEA', icon: 'bi-exclamation-octagon-fill' },
  { key: 'resolvido',    title: 'Resolvido',   color: '#1DB954', tint: '#E8FBF0', icon: 'bi-check-circle-fill' },
];

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' (no timezone shift). */
const fmtDate = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.substring(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

const todayIso = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

export default function TarefasKanbanPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]           = useState<Pendencia[]>([]);
  const [loading, setLoading]       = useState(true);
  const [concluindo, setConcluindo] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // include_resolvido=true returns every status except "concluido" (archived)
      setItems(await http.get<Pendencia[]>('/api/pendencias/?include_resolvido=true'));
    } catch { toast.error('Erro ao carregar tarefas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleConcluir = async (p: Pendencia) => {
    setConcluindo(p.id);
    try {
      await http.put(`/api/pendencias/${p.id}/concluir`, {});
      setItems(prev => prev.filter(i => i.id !== p.id));
      toast.success(`Ticket ${p.ticket} concluído e arquivado`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao concluir');
      fetchData();
    } finally { setConcluindo(null); }
  };

  const today = todayIso();

  const KanbanCard = ({ p, col }: { p: Pendencia; col: typeof COLUMNS[number] }) => {
    const limite = fmtDate(p.data_limite);
    const vencido = !!p.data_limite && p.data_limite.substring(0, 10) < today;
    return (
      <div title={p.descritivo}
        style={{ background: col.tint, border: '1px solid var(--ccm-line)', borderLeft: `4px solid ${col.color}`, borderRadius: 6, padding: '10px 12px', boxShadow: '0 1px 3px rgba(12,25,33,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--ccm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <i className="bi bi-ticket-detailed me-1" style={{ color: col.color }} />{p.ticket || '—'}
          </span>
          <span style={{ background: col.color, color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {p.dias ?? 0} {p.dias === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 4, wordBreak: 'break-word' }}>
          <i className="bi bi-building me-1" style={{ color: 'var(--ccm-gray-dark)' }} />{p.cliente || '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ccm-gray-dark)', marginBottom: 4 }}>
          <i className="bi bi-person-fill me-1" />{p.analista || '—'}
        </div>
        <div style={{ fontSize: 11, color: vencido ? '#E74C3C' : 'var(--ccm-gray-dark)', fontWeight: vencido ? 700 : 400 }}>
          <i className="bi bi-calendar-event me-1" />Limite: {limite ?? '—'}{vencido ? ' (vencida)' : ''}
        </div>
        {col.key === 'resolvido' && (
          <button className="btn btn-sm w-100 mt-2" disabled={concluindo === p.id} onClick={() => handleConcluir(p)}
            style={{ background: col.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 8px' }}>
            {concluindo === p.id
              ? <><span className="spinner-border spinner-border-sm me-1" />Concluindo…</>
              : <><i className="bi bi-archive-fill me-1" />Concluir</>}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Tarefas</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Tarefas — Kanban</div>
        <button className="btn btn-sm" onClick={fetchData} disabled={loading}
          style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 11, padding: '6px 14px' }}>
          <i className="bi bi-arrow-clockwise me-1" />Atualizar
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
          <span className="spinner-border spinner-border-sm me-2" />Carregando...
        </div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: 14, alignItems: 'start' }}>
            {COLUMNS.map(col => {
              const cards = items.filter(p => p.status === col.key);
              return (
                <div key={col.key} style={{ background: '#F7F8FA', border: '1px solid var(--ccm-line)', borderTop: `3px solid ${col.color}`, borderRadius: 6, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--ccm-line)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                      <i className={`bi ${col.icon} me-2`} style={{ color: col.color }} />{col.title}
                    </span>
                    <span style={{ background: col.color, color: '#fff', borderRadius: 99, minWidth: 24, textAlign: 'center', padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{cards.length}</span>
                  </div>
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                    {cards.length === 0
                      ? <div style={{ fontSize: 11, color: 'var(--ccm-gray-medium)', textAlign: 'center', padding: '16px 0' }}>Nenhuma tarefa</div>
                      : cards.map(p => <KanbanCard key={p.id} p={p} col={col} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
