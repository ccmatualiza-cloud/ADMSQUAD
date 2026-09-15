import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string | null;
  last_login: string | null;
}

const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  admin:        { label: 'Admin',          color: '#fff', bg: '#204294' },
  gestor:       { label: 'Gestor',         color: '#fff', bg: '#0F6E56' },
  operador_cx:  { label: 'Operador CX',    color: '#fff', bg: '#8A6800' },
  operador_pmo: { label: 'Operador PMO',   color: '#fff', bg: '#7F77DD' },
  trcx:         { label: 'TRCX',           color: '#fff', bg: '#E74C3C' },
  prcx:         { label: 'PRCX',           color: '#fff', bg: '#1DB954' },
};

const ROLE_OPTIONS = [
  { value: 'admin',        label: 'Admin — acesso total' },
  { value: 'gestor',       label: 'Gestor — visualiza tudo, edita pouco' },
  { value: 'operador_cx',  label: 'Operador CX — acesso Customer Experience' },
  { value: 'operador_pmo', label: 'Operador PMO — acesso PMO e Implantação' },
  { value: 'trcx',         label: 'TRCX — acesso CX e Operações' },
  { value: 'prcx',         label: 'PRCX — acesso CX e Operações' },
];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDatetime(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d.includes('T') ? d : d.replace(' ', 'T'));
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { name: '', email: '', password: '', role: 'operador_cx' };

interface Props { onBack: () => void; }

export default function UsuariosPage({ onBack }: Props) {
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await http.get<User[]>('/api/user/list-with-2fa');
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (u: User) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || (!editUser && (!form.email || !form.password))) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setSaving(true);
    try {
      if (editUser) {
        const body: Record<string, unknown> = { name: form.name, role: form.role };
        if (form.password) body.password = form.password;
        await http.put(`/api/user/${editUser.id}`, body);
        toast.success('Usuário atualizado!');
      } else {
        await http.post('/api/user/', { name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success('Usuário criado!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await http.put(`/api/user/${u.id}`, { active: !u.active });
      toast.success(u.active ? 'Usuário inativado' : 'Usuário ativado');
      fetchUsers();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (ROLES[u.role]?.label ?? u.role).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Configurações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Gestão de Usuários</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Gestão de Usuários</div>

      {/* Tabela */}
      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-people-fill" style={{ color: 'var(--ccm-cyan)', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              Usuários — {filtered.length} registros
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Usuário
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <input type="text" className="form-control" placeholder="Buscar por nome ou nível de acesso..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360, fontSize: 13 }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  {['Nome', 'Nível de Acesso', 'Status', 'Último Acesso', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 16px', textAlign: 'left', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum usuário encontrado</td></tr>
                ) : filtered.map((u, i) => {
                  const roleInfo = ROLES[u.role] ?? { label: u.role, color: '#fff', bg: '#888' };
                  return (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--ccm-ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ccm-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {u.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: roleInfo.bg, color: roleInfo.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: u.active ? '#D4F5E2' : '#FDDEDE', color: u.active ? '#0E7E3B' : '#9B2020', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--ccm-gray-dark)' }}>{fmtDatetime(u.last_login)}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--ccm-gray-dark)' }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: u.active ? '#E74C3C' : '#2ECC71', color: '#fff', fontSize: 11, padding: '4px 10px' }} onClick={() => toggleActive(u)}>
                            <i className={`bi ${u.active ? 'bi-slash-circle' : 'bi-check-circle'} me-1`} />
                            {u.active ? 'Inativar' : 'Ativar'}
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid var(--ccm-blue-light)', borderRadius: 8, padding: '32px 36px', width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ color: 'var(--ccm-blue-light)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão de Usuários</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div className="mb-3">
              <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Nome *</label>
              <input type="text" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 14 }}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>

            {!editUser && (
              <div className="mb-3">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>E-mail *</label>
                <input type="email" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 14 }}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ccm.com.br" />
              </div>
            )}

            <div className="mb-3">
              <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>
                {editUser ? 'Nova Senha (opcional)' : 'Senha *'}
              </label>
              <input type="password" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 14 }}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>

            <div className="mb-4">
              <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Nível de Acesso *</label>
              <select className="form-select mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 }}
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editUser ? 'Salvar Alterações' : 'Criar Usuário'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
