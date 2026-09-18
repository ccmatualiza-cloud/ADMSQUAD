import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

const ATIVIDADE_OPTS = ['Incidente', 'Requisição', 'Implantação', 'Migração', 'Manutenção'];
const emptyForm = { cliente: '', analista: '', ticketproj: '', atividade: 'Incidente', tipoatividade: '', data: new Date().toISOString().split('T')[0] };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function NovaAtividadeModal({ onClose }: { onClose: () => void }) {
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [analistas, setAnalistas] = useState<{ id: number; name: string }[]>([]);
  const [clienteSugs, setClienteSugs] = useState<string[]>([]);
  const [showSugs, setShowSugs]   = useState(false);
  const clienteRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    http.get<{ id: number; name: string }[]>('/api/user/by-role')
      .then(d => setAnalistas([...d].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowSugs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClienteSearch = async (val: string) => {
    setForm(f => ({ ...f, cliente: val }));
    if (val.length < 2) { setShowSugs(false); return; }
    try {
      const d = await http.get<{ razao: string }[]>(`/api/cx/clientes?q=${encodeURIComponent(val)}&limit=10`);
      setClienteSugs(d.map(c => c.razao).filter(Boolean) as string[]);
      setShowSugs(true);
    } catch { setShowSugs(false); }
  };

  const handleSave = async () => {
    if (!form.cliente || !form.analista || !form.tipoatividade) {
      toast.error('Preencha Cliente, Analista e Tipo de Atividade'); return;
    }
    setSaving(true);
    try {
      await http.post('/api/operacoes/atividades', { ...form, status: 'Nao Iniciado' });
      toast.success('Atividade registrada!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #7F77DD', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#7F77DD', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Dashboard — Atividades</div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Registrar Atividade</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div className="row g-3">
          <div className="col-12" ref={clienteRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>Cliente *</label>
            <input type="text" className="form-control mt-1" style={inputStyle}
              value={form.cliente} onChange={e => handleClienteSearch(e.target.value)} placeholder="Digite para buscar..." />
            {showSugs && clienteSugs.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2e3e', border: '1px solid #1a3a6e', borderRadius: 4, zIndex: 100, maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                {clienteSugs.map(s => (
                  <div key={s} onClick={() => { setForm(f => ({ ...f, cliente: s })); setShowSugs(false); }}
                    style={{ padding: '7px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #1a3a6e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#204294')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{s}</div>
                ))}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label style={labelStyle}>Analista *</label>
            <select className="form-select mt-1" style={inputStyle}
              value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
              <option value="">Selecione...</option>
              {analistas.map(a => <option key={a.id} value={a.name.toUpperCase()}>{a.name}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-6">
            <label style={labelStyle}>Data *</label>
            <input type="date" className="form-control mt-1" style={inputStyle}
              value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>

          <div className="col-12 col-md-6">
            <label style={labelStyle}>Ticket / Proj</label>
            <input type="text" className="form-control mt-1" style={inputStyle}
              value={form.ticketproj} onChange={e => setForm(f => ({ ...f, ticketproj: e.target.value }))}
              placeholder="Nº Ticket ou Projeto" />
          </div>

          <div className="col-12 col-md-6">
            <label style={labelStyle}>Atividade *</label>
            <select className="form-select mt-1" style={inputStyle}
              value={form.atividade} onChange={e => setForm(f => ({ ...f, atividade: e.target.value }))}>
              {ATIVIDADE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-6">
            <label style={labelStyle}>Tipo de Atividade *</label>
            <input type="text" className="form-control mt-1" style={inputStyle}
              value={form.tipoatividade} onChange={e => setForm(f => ({ ...f, tipoatividade: e.target.value }))}
              placeholder="Ex: Suporte, Treinamento..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Registrar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
