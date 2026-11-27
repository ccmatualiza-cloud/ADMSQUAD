const MANUAIS_COLOR = '#204294';

// Placeholders until each manual is built — replace title/desc/onClick per card.
const PLACEHOLDERS = [1, 2, 3, 4];

export default function ManuaisAtendimentoPage({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Manuais de Atendimento</span>
      </div>
      <div className="section-title mb-4">Manuais de Atendimento</div>

      <div className="row g-3">
        {PLACEHOLDERS.map(n => (
          <div key={n} className="col-12 col-md-6 col-lg-3">
            <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: `3px solid ${MANUAIS_COLOR}`, borderRadius: 6, padding: '20px 22px', boxShadow: '0 1px 4px rgba(12,25,33,.07)', cursor: 'default', opacity: 0.85 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${MANUAIS_COLOR}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-hourglass-split" style={{ fontSize: 20, color: MANUAIS_COLOR }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Em andamento</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>Em desenvolvimento, aguarde...</div>
              <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: 'var(--ccm-gray-medium)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                Em breve
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
