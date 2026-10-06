'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '448px',
          margin: '0 auto',
          padding: '0 16px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: '16px',
            color: '#0f172a',
            textDecoration: 'none',
            letterSpacing: '-0.025em',
          }}
        >
          Prof Monday Night
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      icon: (isActive) => (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.5' : '2'}
          viewBox="0 0 24 24"
        >
          {/* Rettangolo Campo */}
          <rect x="3" y="4" width="18" height="16" rx="2" />
          {/* Linea di centrocampo */}
          <line x1="12" y1="4" x2="12" y2="20" />
          {/* Cerchio di centrocampo */}
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      href: '/statistiche',
      icon: (isActive) => (
        <svg
          style={{ width: '24px', height: '24px' }}
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.5' : '2'}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        marginTop: '0px',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '40px',
          padding: '0 16px',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? '#0f172a' : '#94a3b8',
                flex: 1,
              }}
            >
              {item.icon(isActive)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Navbar({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />
      {children}
      <BottomNav />
    </div>
  );
}