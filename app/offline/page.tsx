// app/offline/page.tsx
'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100dvh', background: '#080909', color: '#e4e8f0',
      fontFamily: 'sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#0f1012', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Hors ligne</h1>
        <p style={{ fontSize: 14, color: '#7a8599', lineHeight: 1.6, marginBottom: 20 }}>
          MaintaFood n'arrive pas à se connecter. Vérifiez votre connexion.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#00c896', color: '#000', border: 'none',
            borderRadius: 8, padding: '12px 24px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer', width: '100%',
          }}
        >
          🔄 Réessayer
        </button>
        <div style={{
          marginTop: 16, padding: 12,
          background: 'rgba(0,200,150,.06)', border: '1px solid rgba(0,200,150,.2)',
          borderRadius: 8, fontSize: 12, color: '#00c896', textAlign: 'left',
        }}>
          💡 Les pages déjà visitées restent accessibles hors ligne.
        </div>
      </div>
    </div>
  )
}
