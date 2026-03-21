import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Center | Haul Command',
  description: 'Manage your data, export and delete personal information, and control your privacy preferences on Haul Command.',
};

export default function PrivacyCenterPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Privacy Center</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>Under GDPR and global privacy laws, you have the right to access, export, and delete your personal data.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { title: 'Export My Data', desc: 'Download a complete archive of your profile, job history, offers, and activity.', action: 'Export JSON', endpoint: '/api/gdpr/export', icon: '📥' },
            { title: 'Delete My Data', desc: 'Permanently remove your account and all associated personal data within 30 days.', action: 'Request Deletion', endpoint: '/api/gdpr/delete', icon: '🗑️' },
            { title: 'Consent Preferences', desc: 'Manage which types of data processing you consent to.', action: 'Manage Consent', endpoint: '#consent', icon: '⚙️' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.5 }}>{item.desc}</p>
                  <button style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{item.action}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Haul Command is committed to protecting your privacy. We process personal data in accordance with our <a href="/legal/privacy" style={{ color: '#00d4ff' }}>Privacy Policy</a>. For questions, contact <a href="mailto:privacy@haulcommand.com" style={{ color: '#00d4ff' }}>privacy@haulcommand.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
