import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Pendencia {
  id: number; cliente: string; ticket: string; descritivo: string; tratativa: string | null;
  analista: string; status: string; data: string; dias: number | null;
}
const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  aberto:       { label: 'Aberto',       color: '#fff', bg: '#204294' },
  em_andamento: { label: 'Em Andamento', color: '#fff', bg: '#0F6E56' },
  impedimento:  { label: 'Impedimento',  color: '#fff', bg: '#E74C3C' },
  resolvido:    { label: 'Resolvido',    color: '#fff', bg: '#888780' },
};
const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' }, { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'impedimento', label: 'Impedimento' }, { value: 'resolvido', label: 'Resolvido' },
];
const emptyForm = { cliente: '', ticket: '', descritivo: '', tratativa: '', analista: '', status: 'aberto', data: new Date().toISOString().split('T')[0] };
const diasColor = (d: number | null) => d === null ? 'var(--ccm-gray-dark)' : d <= 1 ? '#0F6E56' : d <= 3 ? '#D4A000' : '#E74C3C';
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function DailyPendencias({ onBack }: { onBack: () => void }) {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [analistas, setAnalistas]   = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState<Pendencia | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterAnalista, setFilterAnalista] = useState('');
  const [clienteSugs, setClienteSugs] = useState<string[]>([]);
  const [showSugs, setShowSugs]     = useState(false);
  const clienteRef                  = useRef<HTMLDivElement>(null);

  const fetchData = async (status = filterStatus) => {
    setLoading(true);
    try {
      const params = status === 'resolvido' ? '?include_resolvido=true' : '';
      const [data, anal] = await Promise.all([
        http.get<Pendencia[]>(`/api/pendencias/${params}`),
        http.get<{ id: number; name: string }[]>('/api/pendencias/analistas'),
      ]);
      setPendencias(data); setAnalistas(anal);
    } catch { toast.error('Erro ao carregar pendências'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(''); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowSugs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleClienteChange = async (val: string) => {
    setForm(f => ({ ...f, cliente: val }));
    if (val.length >= 2) {
      try {
        const s = await http.get<string[]>(`/api/pendencias/clientes-autocomplete?q=${encodeURIComponent(val)}`);
        setClienteSugs(s); setShowSugs(s.length > 0);
      } catch { setClienteSugs([]); }
    } else { setClienteSugs([]); setShowSugs(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Pendencia) => { setEditItem(p); setForm({ cliente: p.cliente, ticket: p.ticket, descritivo: p.descritivo, tratativa: p.tratativa ?? '', analista: p.analista, status: p.status, data: p.data }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.cliente || !form.ticket || !form.descritivo || !form.analista || !form.data) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setSaving(true);
    try {
      if (editItem) { await http.put(`/api/pendencias/${editItem.id}`, form); toast.success('Atualizada!'); }
      else { await http.post('/api/pendencias/', form); toast.success('Registrada!'); }
      setShowModal(false); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta pendência?')) return;
    try { await http.del(`/api/pendencias/${id}`); toast.success('Excluída'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const handleResolver = async (id: number) => {
    try { await http.put(`/api/pendencias/${id}`, { status: 'resolvido' }); toast.success('Pendência resolvida!'); fetchData(); }
    catch { toast.error('Erro ao resolver'); }
  };

  const filtered = pendencias.filter(p =>
    [p.cliente, p.ticket, p.descritivo, p.analista].some(v => v.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus ? p.status === filterStatus : true) &&
    (filterAnalista ? p.analista === filterAnalista : true)
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:'var(--ccm-blue)', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color:'var(--ccm-gray-medium)', fontSize:12 }}>/</span>
        <span style={{ color:'var(--ccm-gray-dark)', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>Daily — Pendências</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign:'center' }}>Daily — Pendências</div>

      <div className="table-card">
        <div style={{ background:'var(--ccm-ink)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'6px 6px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color:'#F9E000', fontSize:16 }} />
            <span style={{ color:'#fff', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em' }}>{filtered.length} pendências</span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}><i className="bi bi-plus-lg me-1" />Nova Pendência</button>
        </div>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--ccm-line)', display:'flex', gap:12, flexWrap:'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar cliente, ticket, analista..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:340, fontSize:13 }} />
          <select className="form-select" value={filterAnalista} onChange={e => setFilterAnalista(e.target.value)} style={{ maxWidth:180, fontSize:13 }}>
            <option value="">Todos analistas</option>
            {analistas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
          <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchData(e.target.value); }} style={{ maxWidth:180, fontSize:13 }}>
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX:'auto' }}>
          {loading ? <div style={{ padding:32, textAlign:'center', color:'var(--ccm-gray-dark)' }}><span className="spinner-border spinner-border-sm me-2" />Carregando...</div> : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:'var(--ccm-blue)' }}>
                {['CLIENTE','TICKET','ANALISTA','DESCRITIVO','STATUS','DATA','DIAS','AÇÕES'].map(h => (
                  <th key={h} style={{ color:'#fff', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', padding:'10px 12px', textAlign:'center', fontSize:10, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'var(--ccm-gray-dark)' }}>Nenhuma pendência encontrada</td></tr>
                : filtered.map((p, i) => {
                  const si = STATUS_INFO[p.status] ?? { label: p.status, color:'#fff', bg:'#888' };
                  return <tr key={p.id} style={{ background: i%2===0?'#fff':'#F7F8FA', borderBottom:'1px solid var(--ccm-line)' }}>
                    <td style={{ padding:'9px 12px', fontWeight:600, whiteSpace:'nowrap' }}>{p.cliente.toUpperCase()}</td>
                    <td style={{ padding:'9px 12px', color:'var(--ccm-blue)', fontWeight:600, whiteSpace:'nowrap' }}>{p.ticket.toUpperCase()}</td>
                    <td style={{ padding:'9px 12px', whiteSpace:'nowrap' }}>{(p.analista||'—').toUpperCase()}</td>
                    <td style={{ padding:'9px 12px', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={p.descritivo}>{p.descritivo.toUpperCase()}</td>
                    <td style={{ padding:'9px 12px', whiteSpace:'nowrap' }}><span style={{ background:si.bg, color:si.color, borderRadius:99, padding:'3px 9px', fontSize:10, fontWeight:700 }}>{si.label}</span></td>
                    <td style={{ padding:'9px 12px', color:'var(--ccm-gray-dark)', whiteSpace:'nowrap' }}>{new Date(p.data+'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:diasColor(p.dias), whiteSpace:'nowrap' }}>{p.dias!==null?`${p.dias}d`:'—'}</td>
                    <td style={{ padding:'9px 12px', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn btn-sm" style={{ background: p.tratativa ? '#F9A825' : 'var(--ccm-blue)', color: p.tratativa ? '#5a4000' : '#fff', fontSize:10, padding:'3px 9px' }} onClick={() => openEdit(p)}><i className="bi bi-pencil-fill me-1" />Editar</button>
                        <button className="btn btn-sm" style={{ background:'#1DB954', color:'#fff', fontSize:10, padding:'3px 9px', display: p.status === 'resolvido' ? 'none' : undefined }} onClick={() => handleResolver(p.id)}><i className="bi bi-check-lg me-1" />Ok</button>
                        <button className="btn btn-sm" style={{ background:'#E74C3C', color:'#fff', fontSize:10, padding:'3px 9px' }} onClick={() => handleDelete(p.id)}><i className="bi bi-trash me-1" />Excluir</button>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
          <div style={{ background:'#132230', border:'1px solid #1a3a6e', borderTop:'3px solid #F9E000', borderRadius:8, padding:'28px 32px', width:'100%', maxWidth:560, boxShadow:'0 8px 32px rgba(0,0,0,.4)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ color:'#F9E000', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.18em' }}>Daily — Operações</div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:15, textTransform:'uppercase' }}>{editItem?'Editar Pendência':'Nova Pendência'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background:'transparent', border:'none', color:'#9BA4AB', fontSize:22, cursor:'pointer' }}>×</button>
            </div>
            <div className="row g-3">
              <div className="col-12" ref={clienteRef} style={{ position:'relative' }}>
                <label style={labelStyle}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={inputStyle} value={form.cliente}
                  onChange={e => handleClienteChange(e.target.value)} placeholder="Digite para buscar cliente..." />
                {showSugs && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#1a2e3e', border:'1px solid #1a3a6e', borderRadius:4, zIndex:100, maxHeight:180, overflowY:'auto', marginTop:2 }}>
                    {clienteSugs.map(s => (
                      <div key={s} onClick={() => { setForm(f => ({...f, cliente:s})); setShowSugs(false); }}
                        style={{ padding:'8px 12px', color:'#fff', cursor:'pointer', fontSize:13, borderBottom:'1px solid #1a3a6e' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#204294')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket *</label>
                <input type="text" className="form-control mt-1" style={inputStyle} value={form.ticket} onChange={e => setForm(f=>({...f,ticket:e.target.value}))} placeholder="Nº do ticket" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Analista *</label>
                <select className="form-select mt-1" style={inputStyle} value={form.analista} onChange={e => setForm(f=>({...f,analista:e.target.value}))}>
                  <option value="">Selecione o analista...</option>
                  {analistas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Descritivo *</label>
                <textarea className="form-control mt-1" rows={3} style={{...inputStyle, resize:'vertical'}} value={form.descritivo} onChange={e => setForm(f=>({...f,descritivo:e.target.value}))} placeholder="Descreva a pendência..." />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Tratativa</label>
                <textarea className="form-control mt-1" rows={3} style={{...inputStyle, resize:'vertical'}} value={form.tratativa ?? ''} onChange={e => setForm(f=>({...f,tratativa:e.target.value}))} placeholder="Descreva a tratativa..." />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Status *</label>
                <select className="form-select mt-1" style={inputStyle} value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Data *</label>
                <input type="date" className="form-control mt-1" style={inputStyle} value={form.data} onChange={e => setForm(f=>({...f,data:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-sm" style={{ background:'rgba(255,255,255,.07)', color:'#9BA4AB', fontSize:12, padding:'8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-sm" style={{ background:'#F9E000', color:'#5a4000', fontSize:12, padding:'8px 24px', fontWeight:700 }} onClick={handleSave} disabled={saving}>
                {saving?<><span className="spinner-border spinner-border-sm me-1" />Salvando…</>:<><i className="bi bi-check-lg me-1" />{editItem?'Salvar':'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
