import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth-store';
import { http } from '../../lib/http-client';

interface NavItem { to: string; icon: string; label: string; roles: string[]; }

const ALL_ROLES = ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'user'];

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',     icon: 'bi-grid-1x2-fill',        label: 'Dashboard',              roles: ALL_ROLES },
  { to: '/cx',            icon: 'bi-headset',               label: 'CX - Cust. Experience',  roles: ['admin', 'gestor', 'operador_cx', 'trcx'] },
  { to: '/pmo',           icon: 'bi-building',              label: 'PMO - Implantação',       roles: ['admin', 'gestor', 'operador_pmo', 'prcx'] },
  { to: '/operacoes',     icon: 'bi-gear-wide-connected',   label: 'Operações',              roles: ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx'] },
  { to: '/gestao',        icon: 'bi-graph-up-arrow',        label: 'Gestão',                 roles: ['admin', 'gestor'] },
  { to: '/consulta',      icon: 'bi-search',                label: 'Consulta',               roles: ALL_ROLES },
  { to: '/configuracoes', icon: 'bi-gear-fill',             label: 'Configurações',          roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm]           = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving]       = useState(false);

  const role = user?.role ?? '';

  const handleLogout = () => { logout(); toast.info('Sessão encerrada'); navigate('/login'); };

  const handleChangePw = async () => {
    if (!pwForm.current || !pwForm.newPw) { toast.error('Preencha todos os campos'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Nova senha e confirmação não conferem'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Nova senha deve ter ao menos 6 caracteres'); return; }
    setPwSaving(true);
    try {
      await http.post('/api/user/change-password', { current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success('Senha alterada com sucesso!');
      setShowPwModal(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally { setPwSaving(false); }
  };

  const initials = user?.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() ?? 'U';
  const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
  const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo-ccm-white.png" alt="CCM Tecnologia" />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Principal</div>
          {NAV_ITEMS.filter(item => item.roles.includes(role)).map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${item.icon}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* ADMSQUAD + Warriors logo */}
          <div style={{ textAlign: 'center', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #1a3a6e' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: '8px' }}>
              ADMSQUAD
            </div>
            <img src="/logo-squad-warriors.png" alt="Squad Warriors"
              style={{ height: 'auto', maxHeight: '110px', maxWidth: '110px', width: 'auto', objectFit: 'contain', borderRadius: '6px', display: 'block', margin: '0 auto' }} />
          </div>

          <div className="sidebar-user mb-2">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>

          {/* Alterar senha + Sair lado a lado */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm"
              style={{ flex: 1, background: 'rgba(0,176,250,.12)', color: '#00B0FA', fontSize: 10, fontWeight: 700, padding: '5px 4px' }}
              onClick={() => setShowPwModal(true)}>
              <i className="bi bi-key me-1" />Senha
            </button>
            <button className="btn btn-sm"
              style={{ flex: 1, background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 10, fontWeight: 700, padding: '5px 4px' }}
              onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Alterar Senha */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Minha Conta</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Alterar Senha</div>
              </div>
              <button onClick={() => setShowPwModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Senha Atual *</label>
              <input type="password" className="form-control mt-1" style={inputStyle}
                value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Nova Senha *</label>
              <input type="password" className="form-control mt-1" style={inputStyle}
                value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Confirmar Nova Senha *</label>
              <input type="password" className="form-control mt-1" style={inputStyle}
                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repita a nova senha" />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowPwModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleChangePw} disabled={pwSaving}>
                {pwSaving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
