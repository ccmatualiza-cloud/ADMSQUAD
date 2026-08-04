export default function ZohoDeskDashboard({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Dashboard Zoho Desk</span>
      </div>
      <iframe
        src="https://war.ccmcloud.com.br/ccm/warriors_tickets.html"
        style={{ flex: 1, width: '100%', border: 'none', borderRadius: 8, boxShadow: '0 2px 12px rgba(12,25,33,.1)' }}
        title="Dashboard Zoho Desk"
        allow="clipboard-write"
      />
    </div>
  );
}
