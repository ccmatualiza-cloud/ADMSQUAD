import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authService } from '../../services/service-auth';
import { useAuthStore } from '../../store/auth-store';

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [loading, setLoading]           = useState(false);
  const [step, setStep]                 = useState<'login' | '2fa'>('login');
  const [twoFaToken, setTwoFaToken]     = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [pendingUser, setPendingUser]   = useState<{id:number;name:string;email:string;role:string;avatar_url:string|null}|null>(null);
  const [code, setCode]                 = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleLogin = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res.requires_2fa) {
        setTwoFaToken(res.two_fa_token || '');
        setPendingToken(res.pending_token || '');
        setPendingUser(res.pending_user || null);
        setStep('2fa');
        toast.info('Código enviado para seu email!');
      } else {
        setAuth(res.token, res.user);
        toast.success('Bem-vindo, ' + res.user.name + '!');
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      toast.error(message === 'Invalid credentials' ? 'E-mail ou senha inválidos' : message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async () => {
    if (!code || code.length !== 6) { toast.error('Digite o código de 6 dígitos'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ two_fa_token: twoFaToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Código inválido');
      setAuth(data.token, data.user);
      toast.success('Bem-vindo, ' + data.user.name + '!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  if (step === '2fa') return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo-ccm-white.png" alt="CCM Tecnologia" className="login-logo" />
        <div className="login-title">ADMSQUAD</div>
        <div style={{ color: '#9BA4AB', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
          <i className="bi bi-shield-lock me-2" style={{ color: '#00B0FA' }} />
          Digite o código enviado para seu email
        </div>
        <input
          type="text" maxLength={6} value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handle2FA()}
          placeholder="000000"
          style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 12, background: '#0d1c28', border: '1px solid #1a3a6e', color: '#fff', borderRadius: 8, padding: '12px 0', width: '100%', marginBottom: 16 }}
        />
        <button className="btn btn-ccm-primary w-100" onClick={handle2FA} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Verificar
        </button>
        <button className="btn btn-link w-100 mt-2" style={{ color: '#9BA4AB', fontSize: 12 }} onClick={() => { setStep('login'); setCode(''); }}>
          Voltar ao login
        </button>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo CCM */}
        <img
          src="/logo-ccm-white.png"
          alt="CCM Tecnologia"
          className="login-logo"
        />

        {/* Título */}
        <div className="login-title">ADMSQUAD</div>

        {/* Logo Squad Warriors — abaixo do título, maior */}
        <img
          src="/logo-squad-warriors.png"
          alt="Squad Warriors"
          style={{
            height: 'auto',
            maxHeight: '110px',
            maxWidth: '110px',
            width: 'auto',
            display: 'block',
            objectFit: 'contain',
            margin: '12px auto 24px',
            borderRadius: '6px',
          }}
        />

        <form onSubmit={handleSubmit(handleLogin)} noValidate>
          {/* E-mail */}
          <div className="mb-3">
            <label className="login-label">E-mail</label>
            <input
              type="email"
              className={`form-control login-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="seu@email.com.br"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

          {/* Senha */}
          <div className="mb-4">
            <label className="login-label">Senha</label>
            <input
              type="password"
              className={`form-control login-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-ccm-primary w-100 py-2"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" /> Entrando…</>
              : <><i className="bi bi-box-arrow-in-right me-2" />Entrar</>
            }
          </button>
        </form>

        <div className="login-footer-text">
          CCM Tecnologia &nbsp;·&nbsp; Acesso Restrito
        </div>
      </div>
    </div>
  );
}
