import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Sessao { cod: number; nome: string; descricao: string | null; }

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };
const emptyForm  = { nome: '', descricao: '' };

export default function ChecklistSessoes({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Sessao[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { setItems(await http.get<Sessao[]>('/api/pmo/checklist/sessoes')); }
    catch { toast.error('Erro ao carregar sessões'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (s: Sessao) => { setEditCod(s.cod); setForm({ nome: s.nome, descricao: s.descricao ?? '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/pmo/checklist/sessoes/${editCod}`, form);
        toast.success('Sessão atualizada!');
      } else {
        await http.post('/api/pmo/checklist/sessoes', form);
        toast.success('Sessão criada!');
      }
      setShowModal(false); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir esta sessão?')) return;
    try { await http.del(`/api/pmo/checklist/sessoes/${cod}`); toast.success('Excluída'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Modelos
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Sessões</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Sessões de Checklist</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-collection-fill" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${items.length} sessão(ões)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Nova Sessão
          </button>
        </div>

        <div style={{ padding: '12px 20px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner-border spinner-border-sm me-2" />Carregando...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma sessão cadastrada</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(s => (
                <div key={s.cod} style={{ background: '#F7F8FA', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ccm-ink)' }}>{s.nome}</div>
                    {s.descricao && <div style={{ fontSize: 11, color: 'var(--ccm-gray-dark)', marginTop: 2 }}>{s.descricao}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(s)}>
                      <i className="bi bi-pencil-fill me-1" />Editar
                    </button>
                    <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => handleDelete(s.cod)}>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Sessões</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Sessão' : 'Nova Sessão'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Nome *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Infraestrutura, Banco de Dados..." />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Descrição</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição opcional" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#00B0FA', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Criar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
