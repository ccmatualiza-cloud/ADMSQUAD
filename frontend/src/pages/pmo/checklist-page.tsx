import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import ChecklistDetalhe from './checklist-detalhe';
import ChecklistModelos from './checklist-modelos';

interface Checklist {
  cod: number; cliente: string; implantador: string | null;
  modelo_cod: number | null; status: string;
  total_itens: number; concluidos: number; created_at: string | null;
}

interface Modelo { cod: number; nome: string; descricao: string | null; }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Em Andamento': { bg: '#FFF8CC', color: '#8A6800' },
  'Concluido':    { bg: '#D4F5E2', color: '#0E7E3B' },
  'Cancelado':    { bg: '#FDDEDE', color: '#9B2020' },
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };
const emptyForm  = { cliente: '', implantador: '', modelo_cod: '' };

export default function ChecklistPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]       = useState<Checklist[]>([]);
  const [modelos, setModelos]   = useState<Modelo[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModelos, setShowModelos] = useState(false);
  const [detalhe, setDetalhe]   = useState<Checklist | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([
        http.get<Checklist[]>('/api/pmo/checklists'),
        http.get<Modelo[]>('/api/pmo/checklist/modelos'),
      ]);
      setItems(d); setModelos(m);
    } catch { toast.error('Erro ao carregar checklists'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsuarios([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.cliente) { toast.error('Cliente é obrigatório'); return; }
    setSaving(true);
    try {
      await http.post('/api/pmo/checklists', {
        cliente: form.cliente, implantador: form.implantador,
        modelo_cod: form.modelo_cod ? parseInt(form.modelo_cod) : null,
      });
      toast.success('Checklist criado!');
      setShowModal(false); setForm(emptyForm); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir este checklist?')) return;
    try { await http.del(`/api/pmo/checklists/${cod}`); toast.success('Excluído'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  if (detalhe)     return <ChecklistDetalhe checklist={detalhe} onBack={() => { setDetalhe(null); fetchData(); }} />;
  if (showModelos) return <ChecklistModelos onBack={() => { setShowModelos(false); fetchData(); }} />;

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />PMO
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Checklist</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Checklists de Projetos</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-check2-square" style={{ color: '#1DB954', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${items.length} checklist(s)`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontWeight: 700, fontSize: 12 }}
              onClick={() => setShowModelos(true)}>
              <i className="bi bi-journals me-1" />Modelos
            </button>
            <button className="btn btn-ccm-primary btn-sm" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
              <i className="bi bi-plus-lg me-1" />Criar Checklist
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <i className="bi bi-check2-square" style={{ fontSize: 32, display: 'block', marginBottom: 12, color: 'var(--ccm-gray-medium)' }} />
              Nenhum checklist encontrado
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Cliente</th>
                  <th style={th}>Implantador</th>
                  <th style={{ ...th, textAlign: 'center' }}>Conclusão</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const pct = item.total_itens > 0 ? Math.round((item.concluidos / item.total_itens) * 100) : 0;
                  const sc  = STATUS_COLORS[item.status] ?? { bg: '#eee', color: '#444' };
                  return (
                    <tr key={item.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 700, color: 'var(--ccm-ink)' }}>{item.cliente}</td>
                      <td style={td}>{item.implantador || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <div style={{ width: 80, height: 6, background: '#e2e8ef', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#1DB954' : '#204294', borderRadius: 99, transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#0E7E3B' : 'var(--ccm-ink)' }}>
                            {pct}% <span style={{ fontWeight: 400, color: 'var(--ccm-gray-medium)' }}>({item.concluidos}/{item.total_itens})</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }}
                            onClick={() => setDetalhe(item)}>
                            <i className="bi bi-list-check me-1" />Abrir
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                            onClick={() => handleDelete(item.cod)}>
                            <i className="bi bi-trash" />
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

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #1DB954', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#1DB954', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>PMO — Checklist</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Criar Checklist</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nome do cliente" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Implantador</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.implantador} onChange={e => setForm(f => ({ ...f, implantador: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Modelo (opcional)</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.modelo_cod} onChange={e => setForm(f => ({ ...f, modelo_cod: e.target.value }))}>
                  <option value="">Sem modelo — checklist em branco</option>
                  {modelos.map(m => <option key={m.cod} value={String(m.cod)}>{m.nome}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Criando…</> : <><i className="bi bi-check-lg me-1" />Criar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
