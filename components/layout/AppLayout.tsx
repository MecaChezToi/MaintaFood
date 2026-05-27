'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/layout/AuthProvider'
import { ROLE_CONFIG } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',      icon: '⊞', roles: ['admin','chef','technician'] },
  { href: '/plan',          label: 'Plan du site',   icon: '⊡', roles: ['admin','chef','technician'] },
  { href: '/interventions', label: 'Interventions',  icon: '⚙', roles: ['admin','chef','technician'] },
  { href: '/store',         label: 'Magasin',        icon: '⊟', roles: ['admin','chef','technician'] },
  { href: '/audit',         label: 'Audit',          icon: '✓', roles: ['admin','chef'] },
  { href: '/users',         label: 'Utilisateurs',   icon: '◎', roles: ['admin','chef'] },
  { href: '/settings',      label: 'Paramètres',     icon: '⊕', roles: ['admin'] },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  if (loading || !user) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080909' }}>
      <div style={{ color: '#00c896', fontSize: 13, fontFamily: 'var(--font-mono)' }}>Chargement…</div>
    </div>
  )

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role))
  const mobileNav = visibleNav.slice(0, 5)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', fontFamily: 'var(--font-outfit)' }}>
      {/* ─ SIDEBAR DESKTOP ─ */}
      <aside style={{
        width: 220, minWidth: 220, background: '#0f1012',
        borderRight: '1px solid rgba(255,255,255,.04)',
        display: 'flex', flexDirection: 'column',
      }} className="hide-mobile">
        {/* Logo */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            background: 'rgba(0,200,150,.12)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 6,
          }}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#00c896', letterSpacing: '-.3px' }}>FixOps</span>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#3a4055', marginTop: 4, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: '.6px' }}>
            GMAO Platform
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a4055', padding: '10px 8px 4px' }}>
            Navigation
          </div>
          {visibleNav.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                color: isActive ? '#e4e8f0' : '#7a8599',
                background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
                position: 'relative', transition: 'all .12s',
              }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 2.5, background: '#00c896', borderRadius: '0 2px 2px 0' }} />}
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ margin: 8, padding: 10, background: '#1e2023', borderRadius: 6, border: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
            flexShrink: 0, background: user.color + '22', color: user.color,
          }}>{user.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: ROLE_CONFIG[user.role].color }}>
              {ROLE_CONFIG[user.role].label}
            </div>
          </div>
          <button onClick={signOut} title="Déconnexion" style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4,
            color: '#7a8599', cursor: 'pointer', padding: '4px 6px', fontSize: 12,
          }}>⇥</button>
        </div>
      </aside>

      {/* ─ MAIN ─ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 52, minHeight: 52, background: '#0f1012',
          borderBottom: '1px solid rgba(255,255,255,.04)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>
            {visibleNav.find(n => pathname.startsWith(n.href))?.label || 'FixOps'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: user.color + '22',
              color: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
            }}>{user.avatar}</div>
            <button onClick={signOut} className="hide-mobile" style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 4, color: '#7a8599', cursor: 'pointer', padding: '5px 8px', fontSize: 12,
            }}>Déconnexion</button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: 80 }}>
          {children}
        </div>
      </main>

      {/* ─ MOBILE BOTTOM NAV ─ */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#0f1012', borderTop: '1px solid rgba(255,255,255,.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="show-mobile">
        <div style={{ display: 'flex', minHeight: 64 }}>
          {mobileNav.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '10px 6px', textDecoration: 'none',
                color: isActive ? '#00c896' : '#7a8599', fontSize: 10,
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.3px',
                transition: 'color .12s',
              }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ lineHeight: 1 }}>{item.label.slice(0, 8)}</span>
              </Link>
            )
          })}
          <button onClick={signOut} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '10px 6px', border: 'none', background: 'none',
            color: '#7a8599', fontSize: 10, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '.3px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>⇥</span>
            Quitter
          </button>
        </div>
      </nav>
    </div>
  )
}
