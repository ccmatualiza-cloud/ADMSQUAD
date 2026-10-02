import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ChecklistInfo {
  cod: number; cliente: string; implantador: string | null; status: string;
  total_itens: number; concluidos: number;
}

interface ChecklistItemData {
  cod: number; ordem: number; descricao: string;
  concluido: boolean; obs: string | null; responsavel: string | null; updated_at: string | null;
}

export default function ChecklistDetalhe({ checklist, onBack }: { checklist: ChecklistInfo; onBack: () => void }) {
  const [items, setItems]       = useState<ChecklistItemData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [obsEdit, setObsEdit]       = useState<Record<number, string>>({});
  const [respEdit, setRespEdit]     = useState<Record<number, string>>({});
  const [saving, setSaving]     = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([]);
  const [newItem, setNewItem]   = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await http.get<ChecklistItemData[]>(`/api/pmo/checklists/${checklist.cod}/itens`);
      setItems(data);
      const obs: Record<number, string> = {};
      data.forEach(i => { obs[i.cod] = i.obs ?? ''; });
      setObsEdit(obs);
      setRespEdit(resp);
    } catch { toast.error('Erro ao carregar itens'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchItems();
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsuarios([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const toggleItem = async (item: ChecklistItemData) => {
    setSaving(item.cod);
    try {
      await http.put(`/api/pmo/checklists/itens/${item.cod}`, {
        concluido: !item.concluido, obs: obsEdit[item.cod] ?? '', responsavel: respEdit[item.cod] ?? ''
      });
      fetchItems();
    } catch { toast.error('Erro ao atualizar'); }
    finally { setSaving(null); }
  };

  const saveObs = async (item: ChecklistItemData) => {
    setSaving(item.cod);
    try {
      await http.put(`/api/pmo/checklists/itens/${item.cod}`, {
        concluido: item.concluido, obs: obsEdit[item.cod] ?? '', responsavel: respEdit[item.cod] ?? ''
      });
      toast.success('Observação salva!');
      fetchItems();
    } catch { toast.error('Erro ao salvar obs'); }
    finally { setSaving(null); }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    setAddingItem(true);
    try {
      await http.post(`/api/pmo/checklists/${checklist.cod}/itens`, { descricao: newItem.trim() });
      setNewItem(''); fetchItems();
    } catch { toast.error('Erro ao adicionar item'); }
    finally { setAddingItem(false); }
  };

  const total   = items.length;
  const conc    = items.filter(i => i.concluido).length;
  const pct     = total > 0 ? Math.round((conc / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Checklists
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>{checklist.cliente}</span>
      </div>

      {/* Header card */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--ccm-line)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ccm-gray-medium)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Cliente</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ccm-ink)' }}>{checklist.cliente}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ccm-gray-medium)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Implantador</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{checklist.implantador || '—'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--ccm-gray-medium)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Progresso</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#0E7E3B' : 'var(--ccm-ink)' }}>{pct}% ({conc}/{total})</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#e2e8ef', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#1DB954' : '#204294', borderRadius: 99, transition: 'width .4s' }} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bi bi-list-check" style={{ color: '#1DB954', fontSize: 16 }} />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>Itens do Checklist</span>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner-border spinner-border-sm me-2" />Carregando...</div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {items.map((item, idx) => (
              <div key={item.cod} style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', background: item.concluido ? '#F0FFF5' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <button onClick={() => toggleItem(item)} disabled={saving === item.cod}
                    style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${item.concluido ? '#1DB954' : '#b0b8c1'}`, background: item.concluido ? '#1DB954' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
                    {item.concluido && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 12 }} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.concluido ? '#6b7c8d' : 'var(--ccm-ink)', textDecoration: item.concluido ? 'line-through' : 'none', marginBottom: 6 }}>
                      <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 11, marginRight: 8 }}>{idx + 1}.</span>
                      {item.descricao}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="text" placeholder="Observação..."
                        value={obsEdit[item.cod] ?? ''}
                        onChange={e => setObsEdit(o => ({ ...o, [item.cod]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveObs(item)}
                        style={{ flex: 2, minWidth: 120, fontSize: 11, padding: '4px 8px', border: '1px solid #dde2e8', borderRadius: 4, color: 'var(--ccm-ink)', background: '#F7F8FA' }} />
                      <select
                        value={respEdit[item.cod] ?? ''}
                        onChange={e => setRespEdit(r => ({ ...r, [item.cod]: e.target.value }))}
                        style={{ flex: 1, minWidth: 120, fontSize: 11, padding: '4px 8px', border: '1px solid #dde2e8', borderRadius: 4, color: 'var(--ccm-ink)', background: '#F7F8FA' }}>
                        <option value="">Responsável...</option>
                        {usuarios.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                      <button onClick={() => saveObs(item)} disabled={saving === item.cod}
                        style={{ background: '#204294', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 10, cursor: 'pointer' }}>
                        {saving === item.cod ? '...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add item */}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Adicionar novo item..."
                value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                style={{ flex: 1, fontSize: 13, padding: '8px 12px', border: '1px solid #dde2e8', borderRadius: 6, color: 'var(--ccm-ink)' }} />
              <button onClick={addItem} disabled={addingItem}
                className="btn btn-ccm-primary btn-sm">
                <i className="bi bi-plus-lg me-1" />Adicionar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
