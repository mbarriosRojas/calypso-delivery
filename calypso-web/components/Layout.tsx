'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getSession, logout } from '@/lib/auth'

// ── Icon components (inline SVG to avoid adding a new dependency) ──────────

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconTrips({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function IconDrivers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconVehicles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}

function IconMyTrips({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Nav link config ────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const COORDINATOR_NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard', icon: IconDashboard },
  { label: 'Viajes',      href: '/trips',     icon: IconTrips    },
  { label: 'Conductores', href: '/drivers',   icon: IconDrivers  },
  { label: 'Vehículos',   href: '/vehicles',  icon: IconVehicles },
]

const DRIVER_NAV: NavItem[] = [
  { label: 'Mis viajes',  href: '/my-trips',  icon: IconMyTrips  },
]

// ── Avatar initials helper ─────────────────────────────────────────────────

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

// ── SidebarLink ────────────────────────────────────────────────────────────

function SidebarLink({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-[var(--calypso-orange)] text-white shadow-sm'
          : 'text-slate-300 hover:bg-[var(--sidebar-accent)] hover:text-white',
      ].join(' ')}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

// ── Sidebar inner content ──────────────────────────────────────────────────

function SidebarContent({
  nav,
  pathname,
  email,
  onLinkClick,
}: {
  nav: NavItem[]
  pathname: string
  email: string
  onLinkClick?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--calypso-orange)] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Calypso</p>
            <p className="text-slate-400 text-xs leading-none mt-0.5">Delivery</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <SidebarLink
              key={item.href}
              item={item}
              active={active}
              onClick={onLinkClick}
            />
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--calypso-orange)] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials(email)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-[var(--sidebar-accent)] transition-all duration-150"
        >
          <IconLogout className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}

// ── Main Layout component ──────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [nav, setNav] = useState<NavItem[]>(COORDINATOR_NAV)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setUserEmail(session.user.email ?? '')
      setNav(session.user.role === 'COORDINATOR' ? COORDINATOR_NAV : DRIVER_NAV)
    }
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Page title derived from current path
  const currentItem = [...COORDINATOR_NAV, ...DRIVER_NAV].find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageTitle = currentItem?.label ?? 'Calypso Delivery'

  return (
    <div className="flex h-full min-h-screen bg-[var(--calypso-surface)]">
      {/* ── Desktop Sidebar ── */}
      <aside className="calypso-sidebar hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-30 shadow-xl">
        <SidebarContent
          nav={nav}
          pathname={pathname}
          email={userEmail}
        />
      </aside>

      {/* ── Mobile Sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          'calypso-sidebar lg:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navegación principal"
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[var(--sidebar-accent)] transition"
            aria-label="Cerrar menú"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          nav={nav}
          pathname={pathname}
          email={userEmail}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 shadow-sm">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <IconMenu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="text-sm font-semibold text-slate-800 flex-1 truncate">
            {pageTitle}
          </h1>

          {/* Right side: user info */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 leading-none">Conectado como</p>
              <p className="text-xs font-medium text-slate-700 leading-none mt-0.5 max-w-[140px] truncate">{userEmail}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--calypso-orange)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials(userEmail)}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
