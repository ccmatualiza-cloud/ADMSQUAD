import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Colaborador {
  cod: number; colab: string | null; area: string | null; depto: string | null;
  dt_admissao: string | null; prx_calcferias: string | null; prx_anoref: string | null;
  horario: string | null; almoco: string | null; almocof: string | null;
  horariof: string | null; userr: string | null; email: string | null;
  saidaemp: string | null; motivo: string | null;
}

const emptyForm = {
  colab: '', area: '', depto: '', dt_admissao: '', prx_calcferias: '', prx_anoref: '',
  horario: '', almoco: '', almocof: '', horariof: '', userr: '', email: '', saidaemp: '', motivo: '',
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function ColaboradoresPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Colaborador[]>([]);
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
      const data = await http.get<Colaborador[]>(`/api/gestao/colaboradores${params}`);
      setItems(data);
    } catch { toast.error('Erro ao carregar colaboradores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Colaborador) => {
    setEditCod(c.cod);
    setForm({
      colab: c.colab ?? '', area: c.area ?? '', depto: c.depto ?? '',
      dt_admissao: c.dt_admissao ?? '', prx_calcferias: c.prx_calcferias ?? '',
      prx_anoref: c.prx_anoref ?? '', horario: c.horario ?? '',
      almoco: c.almoco ?? '', almocof: c.almocof ?? '', horariof: c.horariof ?? '',
      userr: c.userr ?? '', email: c.email ?? '', saidaemp: c.saidaemp ?? '', motivo: c.motivo ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.colab) { toast.error('Nome do colaborador é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/colaboradores/${editCod}`, form);
        toast.success('Colaborador atualizado!');
      } else {
        await http.post('/api/gestao/colaboradores', form);
        toast.success('Colaborador cadastrado!');
      }
      setShowModal(false); fetchData(search);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setSaving(false); }
  };

  const f = (v: string) => setForm(prev => ({ ...prev }));
  void f;

  const filtered = items.filter(i =>
    [i.colab, i.area, i.depto, i.email].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  const Field = ({ label, fkey }: { label: string; fkey: keyof typeof emptyForm }) => (
    <div className="col-12 col-md-6">
      <label style={labelStyle}>{label}</label>
      <input type="text" className="form-control mt-1" style={inputStyle}
        value={form[fkey]} onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Colaboradores</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Colaboradores</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-people-fill" style={{ color: '#1DB954', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} colaborador(es)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Colaborador
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <input type="text" className="form-control" placeholder="Buscar por nome, área, depto, email..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 360, fontSize: 13 }} />
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
                  <th style={th}>Área</th>
                  <th style={th}>Depto</th>
                  <th style={th}>Dt. Admissão</th>
                  <th style={th}>Prx. Férias</th>
                  <th style={th}>Horário</th>
                  <th style={th}>Horário F.</th>
                  <th style={th}>Almoço</th>
                  <th style={th}>Email</th>
                  <th style={th}>Saída Emp.</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum colaborador encontrado</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{c.colab || '—'}</td>
                    <td style={td}>{c.area || '—'}</td>
                    <td style={td}>{c.depto || '—'}</td>
                    <td style={td}>{c.dt_admissao || '—'}</td>
                    <td style={td}>{c.prx_calcferias || '—'}</td>
                    <td style={td}>{c.horario || '—'}</td>
                    <td style={td}>{c.horariof || '—'}</td>
                    <td style={td}>{c.almoco || '—'}</td>
                    <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</td>
                    <td style={td}>{c.saidaemp || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => openEdit(c)}>
                        <i className="bi bi-pencil-fill me-1" />Editar
                      </button>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #1DB954', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 640, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#1DB954', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão — Colaboradores</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Colaborador' : 'Novo Colaborador'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Nome *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.colab} onChange={e => setForm(f => ({ ...f, colab: e.target.value }))} placeholder="Nome do colaborador" />
              </div>
              <Field label="Área"            fkey="area" />
              <Field label="Departamento"    fkey="depto" />
              <Field label="Dt. Admissão"    fkey="dt_admissao" />
              <Field label="Prx. Calc Férias" fkey="prx_calcferias" />
              <Field label="Prx. Ano Ref."   fkey="prx_anoref" />
              <Field label="Horário"         fkey="horario" />
              <Field label="Horário F."      fkey="horariof" />
              <Field label="Almoço"          fkey="almoco" />
              <Field label="Almoço F."       fkey="almocof" />
              <Field label="Usuário"         fkey="userr" />
              <div className="col-12">
                <label style={labelStyle}>Email</label>
                <input type="email" className="form-control mt-1" style={inputStyle}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
              </div>
              <Field label="Saída Emp."      fkey="saidaemp" />
              <div className="col-12">
                <label style={labelStyle}>Motivo</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Motivo de saída (se aplicável)" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
