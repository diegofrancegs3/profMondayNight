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
          height: '48px',
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
      label: 'Partita',
      href: '/',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill={pathname === '/' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={pathname === '/' ? '0' : '2'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Classifiche',
      href: '/statistiche',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill={pathname === '/statistiche' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={pathname === '/statistiche' ? '0' : '2'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        marginTop: '24px',
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
          height: '56px',
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? '#0f172a' : '#94a3b8',
                flex: 1,
              }}
            >
              {item.icon}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  marginTop: '2px',
                }}
              >
                {item.label}
              </span>
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