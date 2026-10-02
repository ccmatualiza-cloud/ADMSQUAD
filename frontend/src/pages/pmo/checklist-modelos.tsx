import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import ChecklistSessoes from './checklist-sessoes';

interface Modelo { cod: number; nome: string; descricao: string | null; }

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ChecklistModelos({ onBack }: { onBack: () => void }) {
  const [modelos, setModelos]       = useState<Modelo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showSessoes, setShowSessoes] = useState(false);
  const [editCod, setEditCod]       = useState<number | null>(null);
  const [form, setForm]             = useState({ nome: '', descricao: '', itens: [''] });
  const [saving, setSaving]         = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { setModelos(await http.get<Modelo[]>('/api/pmo/checklist/modelos')); }
    catch { toast.error('Erro ao carregar modelos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (showSessoes) return <ChecklistSessoes onBack={() => setShowSessoes(false)} />;

  const openCreate = () => {
    setEditCod(null);
    setForm({ nome: '', descricao: '', itens: [''] });
    setShowModal(true);
  };

  const openEdit = async (m: Modelo) => {
    setEditCod(m.cod);
    setForm({ nome: m.nome, descricao: m.descricao ?? '', itens: [''] });
    try {
      const itens = await http.get<{ cod: number; descricao: string }[]>(`/api/pmo/checklist/modelos/${m.cod}/itens`);
      setForm(f => ({ ...f, itens: itens.length > 0 ? itens.map(i => i.descricao) : [''] }));
    } catch { /* silent */ }
    setShowModal(true);
  };

  const addLinha    = () => setForm(f => ({ ...f, itens: [...f.itens, ''] }));
  const updateLinha = (i: number, v: string) => setForm(f => { const itens = [...f.itens]; itens[i] = v; return { ...f, itens }; });
  const removeLinha = (i: number) => setForm(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    const itens = form.itens.filter(i => i.trim());
    if (itens.length === 0) { toast.error('Adicione pelo menos um item'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/pmo/checklist/modelos/${editCod}`, { nome: form.nome, descricao: form.descricao, itens });
        toast.success('Modelo atualizado!');
      } else {
        await http.post('/api/pmo/checklist/modelos', { nome: form.nome, descricao: form.descricao, itens });
        toast.success('Modelo criado!');
      }
      setShowModal(false);
      setForm({ nome: '', descricao: '', itens: [''] });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir este modelo?')) return;
    try { await http.del(`/api/pmo/checklist/modelos/${cod}`); toast.success('Excluído'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Checklists
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Modelos</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Modelos de Checklist</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-journals" style={{ color: '#7F77DD', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${modelos.length} modelo(s)`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: '#00B0FA', color: '#fff', fontWeight: 700, fontSize: 12 }}
              onClick={() => setShowSessoes(true)}>
              <i className="bi bi-collection-fill me-1" />Departamentos
            </button>
            <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />Novo Modelo
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 20px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner-border spinner-border-sm me-2" />Carregando...</div>
          ) : modelos.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum modelo cadastrado</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modelos.map(m => (
                <div key={m.cod} style={{ background: '#F7F8FA', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ccm-ink)' }}>{m.nome}</div>
                    {m.descricao && <div style={{ fontSize: 11, color: 'var(--ccm-gray-dark)', marginTop: 2 }}>{m.descricao}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }}
                      onClick={() => openEdit(m)}>
                      <i className="bi bi-pencil-fill me-1" />Editar
                    </button>
                    <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                      onClick={() => handleDelete(m.cod)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #7F77DD', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 540, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#7F77DD', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>PMO — Modelos</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Modelo' : 'Novo Modelo'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Nome do Modelo *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Implantação Padrão" />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Descrição</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição opcional" />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Itens do Checklist *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {form.itens.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: '#9BA4AB', fontSize: 11, minWidth: 20 }}>{i + 1}.</span>
                    <input type="text" className="form-control" style={{ ...inputStyle, flex: 1 }}
                      value={item} onChange={e => updateLinha(i, e.target.value)} placeholder="Descreva o item..." />
                    {form.itens.length > 1 && (
                      <button onClick={() => removeLinha(i)} style={{ background: 'transparent', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: 16 }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addLinha} style={{ background: 'rgba(127,119,221,.15)', border: '1px dashed #7F77DD', color: '#7F77DD', borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  <i className="bi bi-plus me-1" />Adicionar Item
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Criar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
