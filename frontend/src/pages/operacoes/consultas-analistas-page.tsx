import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ConsultaItem {
  cod: number; nome: string | null; analista: string | null; link: string | null;
}

const emptyForm = { nome: '', analista: '', link: '' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ConsultasAnalistasPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<ConsultaItem[]>([]);
  const [usuarios, setUsuarios]   = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await http.get<ConsultaItem[]>(`/api/operacoes/consultas-analistas${params}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar consultas'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setUsuarios([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: ConsultaItem) => {
    setEditCod(c.cod);
    setForm({ nome: c.nome ?? '', analista: c.analista ?? '', link: c.link ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.analista) { toast.error('Nome e Analista são obrigatórios'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/operacoes/consultas-analistas/${editCod}`, form);
        toast.success('Atualizado!');
      } else {
        await http.post('/api/operacoes/consultas-analistas', form);
        toast.success('Cadastrado!');
      }
      setShowModal(false); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir esta consulta?')) return;
    try { await http.del(`/api/operacoes/consultas-analistas/${cod}`); toast.success('Excluída'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i =>
    [i.nome, i.analista, i.link].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const analistas = Array.from(new Set(filtered.map(i => i.analista || 'Outros'))).sort();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Consultas Analistas</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Consultas Analistas</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-person-lines-fill" style={{ color: '#00B0FA', fontSize: 18 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} consulta(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Nova Consulta
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <input type="text" className="form-control" placeholder="Buscar por nome, analista ou link..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360, fontSize: 13 }} />
        </div>

        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma consulta encontrada</div>
          ) : (
            analistas.map(analista => {
              const analistaItems = filtered.filter(i => (i.analista || 'Outros') === analista);
              return (
                <div key={analista} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '2px solid #00B0FA', paddingBottom: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-person-fill" />{analista}
                    <span style={{ fontSize: 10, color: 'var(--ccm-gray-medium)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({analistaItems.length} consulta{analistaItems.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="row g-2">
                    {analistaItems.map(item => (
                      <div key={item.cod} className="col-12 col-md-6 col-lg-4">
                        <div style={{ background: '#F7F8FA', border: '1px solid var(--ccm-line)', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ccm-ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome || '—'}</div>
                            {item.link ? (
                              <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 11, color: '#00B0FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>
                                <i className="bi bi-box-arrow-up-right me-1" />{item.link}
                              </a>
                            ) : <span style={{ fontSize: 11, color: 'var(--ccm-gray-medium)' }}>Sem link</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => openEdit(item)}>
                              <i className="bi bi-pencil-fill" />
                            </button>
                            <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => handleDelete(item.cod)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações — Consultas</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Consulta' : 'Nova Consulta'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Analista *</label>
              <select className="form-select mt-1" style={inputStyle}
                value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
                <option value="">Selecione o analista...</option>
                {usuarios.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Nome da Consulta *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Clientes em atraso, Top 10 usuários..." />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Link / URL</label>
              <input type="url" className="form-control mt-1" style={inputStyle}
                value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#00B0FA', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
