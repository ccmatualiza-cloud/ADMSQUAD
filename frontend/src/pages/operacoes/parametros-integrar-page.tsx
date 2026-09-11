import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Parametro {
  cod: number; integracao: string | null; homologado: string | null;
  bandeira: string | null; ativo: string | null; manual: string | null;
  estrutura: string | null; tipo: string | null; desenvolvedor: string | null;
}

const SN_OPTS = ['Sim', 'Nao'];
const emptyForm = { integracao: '', homologado: 'Nao', bandeira: '', ativo: 'Sim', manual: '', estrutura: '', tipo: '', desenvolvedor: '' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ParametrosIntegrarPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Parametro[]>([]);
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
      const data = await http.get<Parametro[]>(`/api/operacoes/parametros-integrar${params}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar parâmetros'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Parametro) => {
    setEditCod(p.cod);
    setForm({ integracao: p.integracao ?? '', homologado: p.homologado ?? 'Nao',
              bandeira: p.bandeira ?? '', ativo: p.ativo ?? 'Sim',
              manual: p.manual ?? '', estrutura: p.estrutura ?? '',
              tipo: p.tipo ?? '', desenvolvedor: p.desenvolvedor ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.integracao) { toast.error('Integração é obrigatória'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/operacoes/parametros-integrar/${editCod}`, form);
        toast.success('Atualizado!');
      } else {
        await http.post('/api/operacoes/parametros-integrar', form);
        toast.success('Cadastrado!');
      }
      setShowModal(false); fetchData(search);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir este parâmetro?')) return;
    try { await http.del(`/api/operacoes/parametros-integrar/${cod}`); toast.success('Excluído'); fetchData(search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i =>
    [i.integracao, i.bandeira, i.tipo, i.desenvolvedor].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };
  const badge = (v: string | null, yes = 'Sim') => v === yes
    ? { bg: '#D4F5E2', color: '#0E7E3B' }
    : { bg: '#FDDEDE', color: '#9B2020' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Integrações de Clientes
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Parâmetros</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Parâmetros de Integração</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-sliders" style={{ color: '#F9A825', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} parâmetro(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Parâmetro
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por integração, bandeira, tipo, desenvolvedor..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 380, fontSize: 13 }} />
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
                  <th style={th}>Integração</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Bandeira</th>
                  <th style={th}>Desenvolvedor</th>
                  <th style={{ ...th, textAlign: 'center' }}>Homologado</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ativo</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum parâmetro encontrado</td></tr>
                ) : filtered.map((p, i) => {
                  const bh = badge(p.homologado);
                  const ba = badge(p.ativo);
                  return (
                    <tr key={p.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.integracao || '—'}</td>
                      <td style={td}>{p.tipo || '—'}</td>
                      <td style={td}>{p.bandeira || '—'}</td>
                      <td style={td}>{p.desenvolvedor || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: bh.bg, color: bh.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{p.homologado || 'Nao'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: ba.bg, color: ba.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{p.ativo || 'Sim'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(p)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(p.cod)}>
                            <i className="bi bi-trash me-1" />Excluir
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #F9A825', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 580, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#F9A825', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Parâmetros — Integração</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Parâmetro' : 'Novo Parâmetro'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Integração *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.integracao} onChange={e => setForm(f => ({ ...f, integracao: e.target.value }))} placeholder="Nome da integração" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Tipo</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Tipo de integração" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Bandeira</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.bandeira} onChange={e => setForm(f => ({ ...f, bandeira: e.target.value }))} placeholder="Bandeira" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Desenvolvedor</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.desenvolvedor} onChange={e => setForm(f => ({ ...f, desenvolvedor: e.target.value }))} placeholder="Desenvolvedor" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Manual (Link)</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.manual} onChange={e => setForm(f => ({ ...f, manual: e.target.value }))} placeholder="Link do manual" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Estrutura</label>
                <textarea className="form-control mt-1" rows={2} style={{ ...inputStyle, resize: 'vertical' }}
                  value={form.estrutura} onChange={e => setForm(f => ({ ...f, estrutura: e.target.value }))} placeholder="Estrutura da integração" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Homologado</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.homologado} onChange={e => setForm(f => ({ ...f, homologado: e.target.value }))}>
                  {SN_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ativo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.value }))}>
                  {SN_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#F9A825', color: '#5a4000', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
