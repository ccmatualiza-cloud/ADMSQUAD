import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface GcolabItem { cod: number; colab: string | null; }

interface Ausencia {
  cod: number; colaborador: string | null; tipo: string | null;
  data_ini: string | null; hora_ini: string | null;
  data_fim: string | null; hora_fim: string | null;
}

const TIPO_OPTS = ['Férias','Licença Médica','Banco de Horas','Abono','Day Off','Ausência Justificada','Ausência Injustificada','Outro'];
const emptyForm = { colaborador: '', tipo: '', data_ini: '', hora_ini: '', data_fim: '', hora_fim: '' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function AusenciasPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Ausencia[]>([]);
  const [colab, setColab]         = useState<GcolabItem[]>([]);
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
      const data = await http.get<Ausencia[]>(`/api/gestao/ausencias${params}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar ausências'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    http.get<GcolabItem[]>('/api/gestao/colaboradores?status_filter=Ativo')
      .then(d => setColab([...d].sort((a, b) => (a.colab || '').localeCompare(b.colab || ''))))
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a: Ausencia) => {
    setEditCod(a.cod);
    setForm({ colaborador: a.colaborador ?? '', tipo: a.tipo ?? '', data_ini: a.data_ini ?? '', hora_ini: a.hora_ini ?? '', data_fim: a.data_fim ?? '', hora_fim: a.hora_fim ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.colaborador) { toast.error('Colaborador é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/ausencias/${editCod}`, form);
        toast.success('Ausência atualizada!');
      } else {
        await http.post('/api/gestao/ausencias', form);
        toast.success('Ausência registrada!');
      }
      setShowModal(false); fetchData(search);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Excluir esta ausência?')) return;
    try { await http.del(`/api/gestao/ausencias/${cod}`); toast.success('Excluída'); fetchData(search); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i =>
    [i.colaborador, i.tipo].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Colaboradores
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Ausências</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Ausências</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-calendar-x-fill" style={{ color: '#F9A825', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} ausência(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Nova Ausência
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por colaborador ou tipo..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 320, fontSize: 13 }} />
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData(search)}>
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
                  <th style={th}>Colaborador</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Data Ini.</th>
                  <th style={th}>Hora Ini.</th>
                  <th style={th}>Data Fim</th>
                  <th style={th}>Hora Fim</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma ausência encontrada</td></tr>
                ) : filtered.map((a, i) => (
                  <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{a.colaborador || '—'}</td>
                    <td style={td}>
                      <span style={{ background: '#FFF8E1', color: '#8A6800', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                        {a.tipo || '—'}
                      </span>
                    </td>
                    <td style={td}>{a.data_ini || '—'}</td>
                    <td style={td}>{a.hora_ini || '—'}</td>
                    <td style={td}>{a.data_fim || '—'}</td>
                    <td style={td}>{a.hora_fim || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(a)}>
                          <i className="bi bi-pencil-fill me-1" />Editar
                        </button>
                        <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(a.cod)}>
                          <i className="bi bi-trash me-1" />Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #F9A825', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#F9A825', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Colaboradores — Ausências</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Ausência' : 'Nova Ausência'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Colaborador *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.colaborador} onChange={e => setForm(f => ({ ...f, colaborador: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {colab.map(c => <option key={c.cod} value={c.colab || ''}>{c.colab || '—'}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Tipo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {TIPO_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label style={labelStyle}>Data Inicial</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.data_ini} onChange={e => setForm(f => ({ ...f, data_ini: e.target.value }))} placeholder="dd/mm/aaaa" maxLength={10} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Hora Inicial</label>
                <input type="time" className="form-control mt-1" style={inputStyle}
                  value={form.hora_ini} onChange={e => setForm(f => ({ ...f, hora_ini: e.target.value }))} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Data Final</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} placeholder="dd/mm/aaaa" maxLength={10} />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Hora Final</label>
                <input type="time" className="form-control mt-1" style={inputStyle}
                  value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: '#F9A825', color: '#5a4000', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
