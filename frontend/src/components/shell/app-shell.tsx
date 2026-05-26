import Link from 'next/link';
import type { ReactNode } from 'react';

type NavKey = 'dashboard' | 'assignments' | 'create' | 'toolkit';

interface AppShellProps {
  activeNav: NavKey;
  title: string;
  subtitle: string;
  mobileTitle?: string;
  topAction?: ReactNode;
  showBack?: boolean;
  backHref?: string;
  children: ReactNode;
}

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Home', href: '/' },
  { key: 'assignments', label: 'Assignments', href: '/' },
  { key: 'create', label: 'Create Assignment', href: '/assignments/new' },
  { key: 'toolkit', label: 'AI Toolkit', href: '#' },
];

function AppIcon() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(180deg,#E56820_0%,#D45E3E_100%)] text-base font-black text-white shadow-[0_18px_32px_rgba(0,0,0,0.18)]">
      V
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
        active
          ? 'bg-[#F0F0F0] font-semibold text-[#303030]'
          : 'text-[#5E5E5ECC] hover:bg-white/80 hover:text-[#303030]'
      }`}
    >
      <span>{item.label}</span>
      {active ? (
        <span className="rounded-full bg-[#FF5623] px-2 py-0.5 text-[11px] font-semibold text-white">
          Live
        </span>
      ) : null}
    </Link>
  );
}

function MobileNav({ activeNav }: { activeNav: NavKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-[#181818]/95 px-4 py-3 backdrop-blur xl:hidden">
      <div className="mx-auto flex max-w-sm items-center justify-between rounded-[26px] bg-[#181818] px-4 py-2 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
        {navItems.map((item) => {
          const active = activeNav === item.key || (item.key === 'assignments' && activeNav === 'dashboard');
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold transition ${
                active ? 'text-white' : 'text-white/35'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  active ? 'bg-[#FF5623] shadow-[0_0_16px_rgba(255,86,35,0.8)]' : 'bg-white/25'
                }`}
              />
              {item.key === 'create' ? 'Create' : item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  activeNav,
  title,
  subtitle,
  mobileTitle,
  topAction,
  showBack = false,
  backHref = '/',
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#EEEEEE_0%,#DADADA_100%)] text-[#303030]">
      <div className="pointer-events-none absolute inset-x-0 top-[20rem] mx-auto h-[26rem] w-[72rem] max-w-full rounded-full bg-[rgba(76,76,76,0.28)] blur-[180px]" />

      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-3 px-3 py-3 xl:gap-4">
        <aside className="hidden w-[304px] shrink-0 rounded-[28px] bg-white p-6 shadow-[0_28px_60px_rgba(0,0,0,0.18)] xl:flex xl:flex-col xl:justify-between">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <AppIcon />
              <div>
                <div className="font-[family-name:var(--font-bricolage)] text-[28px] font-bold tracking-[-0.08em]">
                  VedaAI
                </div>
              </div>
            </div>

            <Link
              href="/assignments/new"
              className="flex items-center justify-center rounded-full bg-[#272727] px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_-1px_3px_rgba(177,177,177,0.6),inset_0_0_30px_rgba(255,255,255,0.22)]"
            >
              Create Assignment
            </Link>

            <div className="space-y-2">
              {navItems.map((item) => (
                <SidebarLink key={item.key} item={item} active={activeNav === item.key || (item.key === 'assignments' && activeNav === 'dashboard')} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full rounded-2xl px-4 py-3 text-left text-sm text-[#5E5E5ECC] transition hover:bg-[#F0F0F0] hover:text-[#303030]">
              Settings
            </button>
            <div className="rounded-[22px] bg-[#F0F0F0] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[linear-gradient(180deg,#FFDFC8_0%,#F0B28B_100%)] text-lg font-bold text-[#7A3A1E]">
                  DP
                </div>
                <div>
                  <p className="font-semibold">Delhi Public School</p>
                  <p className="text-sm text-[#5E5E5E]">Bokaro Steel City</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-24px)] flex-1 flex-col">
          <div className="hidden items-center gap-4 rounded-[20px] bg-white/80 px-6 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur xl:flex">
            {showBack ? (
              <Link
                href={backHref}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#303030] shadow-sm transition hover:-translate-x-0.5"
              >
                ←
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-bricolage)] text-sm font-semibold text-[#A9A9A9]">
                Assignment
              </p>
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-[#F6F6F6] text-sm font-semibold">
              !
            </button>
            <div className="flex items-center gap-3 rounded-xl px-1 py-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(180deg,#E9E9E9_0%,#CFCFCF_100%)] text-xs font-semibold">
                JD
              </div>
              <span className="text-sm font-semibold">John Doe</span>
            </div>
          </div>

          <div className="xl:hidden">
            <div className="flex items-center gap-3 px-1 pb-6 pt-2">
              {showBack ? (
                <Link
                  href={backHref}
                  className="grid h-12 w-12 place-items-center rounded-full bg-white/55 text-lg shadow-[0_16px_32px_rgba(0,0,0,0.12)] backdrop-blur"
                >
                  ←
                </Link>
              ) : null}
              <div className="flex-1 text-center font-[family-name:var(--font-bricolage)] text-base font-bold tracking-[-0.04em]">
                {mobileTitle ?? title}
              </div>
            </div>
          </div>

          <div className="flex-1 pb-28 xl:pb-0">
            <header className="mb-8 mt-2 flex flex-col gap-4 px-1 xl:mt-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full border-4 border-[#4BC26D66] bg-[#4BC26D]" />
                  <div>
                    <h1 className="font-[family-name:var(--font-bricolage)] text-[22px] font-bold tracking-[-0.05em] xl:text-[28px]">
                      {title}
                    </h1>
                    <p className="text-sm text-[#5E5E5E99]">{subtitle}</p>
                  </div>
                </div>
              </div>
              {topAction ? <div className="shrink-0">{topAction}</div> : null}
            </header>

            <main>{children}</main>
          </div>
        </div>
      </div>

      <MobileNav activeNav={activeNav} />
    </div>
  );
}
