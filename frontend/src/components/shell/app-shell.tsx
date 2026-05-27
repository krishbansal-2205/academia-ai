'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';

export type NavKey = 'home' | 'groups' | 'assignments' | 'toolkit' | 'library';

interface AppShellProps {
  activeNav: NavKey;
  title: string;
  subtitle?: string;
  mobileTitle?: string;
  topAction?: ReactNode;
  showBack?: boolean;
  backHref?: string;
  children: ReactNode;
}

/* ─────────────────────────────────────────
   Sidebar nav definition (no badges)
───────────────────────────────────────── */
const sidebarNav: { key: NavKey; label: string; href: string }[] = [
  { key: 'home',        label: 'Home',                href: '/' },
  { key: 'groups',      label: 'My Groups',           href: '#' },
  { key: 'assignments', label: 'Assignments',         href: '/' },
  { key: 'toolkit',     label: "AI Teacher's Toolkit", href: '#' },
  { key: 'library',     label: 'My Library',          href: '#' },
];

/* ─────────────────────────────────────────
   Mobile bottom-tab items — corrected labels
───────────────────────────────────────── */
const mobileNav: { key: NavKey; label: string; href: string }[] = [
  { key: 'home',        label: 'Home',       href: '/' },
  { key: 'assignments', label: 'Assignments', href: '/' },
  { key: 'library',     label: 'Library',    href: '#' },
  { key: 'toolkit',     label: 'AI Toolkit', href: '#' },
];

/* ─────────────────────────────────────────
   Sidebar SVG icons (dark, for white bg)
───────────────────────────────────────── */
function IconHome({ active }: { active: boolean }) {
  const c = active ? '#111' : '#6B6B6B';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
        stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 21v-7h6v7" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}
function IconGroups({ active }: { active: boolean }) {
  const c = active ? '#111' : '#6B6B6B';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.7"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}
function IconAssignments({ active }: { active: boolean }) {
  const c = active ? '#111' : '#6B6B6B';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}
function IconToolkit({ active }: { active: boolean }) {
  const c = active ? '#111' : '#6B6B6B';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l1.8 5.5H20l-4.9 3.5 1.9 5.8L12 13.5l-5 3.3 1.9-5.8L4 7.5h6.2L12 2z"
        stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}
function IconLibrary({ active }: { active: boolean }) {
  const c = active ? '#111' : '#6B6B6B';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="#6B6B6B" strokeWidth="1.7"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="#6B6B6B" strokeWidth="1.7"/>
    </svg>
  );
}

/* Sparkle icon for Create Assignment button */
function SparkleIcon({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {/* Classic 4-point sparkle / cross star */}
      <path d="M12 2C12 2 13 7 13 12C13 17 12 22 12 22C12 22 11 17 11 12C11 7 12 2 12 2Z"/>
      <path d="M2 12C2 12 7 11 12 11C17 11 22 12 22 12C22 12 17 13 12 13C7 13 2 12 2 12Z"/>
      <path d="M5.6 5.6C5.6 5.6 8.8 9.5 12 12C15.2 14.5 18.4 18.4 18.4 18.4C18.4 18.4 15.2 14.5 12 12C8.8 9.5 5.6 5.6 5.6 5.6Z"/>
      <path d="M18.4 5.6C18.4 5.6 15.2 9.5 12 12C8.8 14.5 5.6 18.4 5.6 18.4C5.6 18.4 8.8 14.5 12 12C15.2 9.5 18.4 5.6 18.4 5.6Z"/>
    </svg>
  );
}

/* Map nav keys → icon components */
const sidebarIcons: Record<NavKey, (props: { active: boolean }) => React.ReactElement> = {
  home:        IconHome,
  groups:      IconGroups,
  assignments: IconAssignments,
  toolkit:     IconToolkit,
  library:     IconLibrary,
};

/* ─────────────────────────────────────────
   Mobile tab icons (white, for dark bg)
───────────────────────────────────────── */
function TabHome({ active }: { active: boolean }) {
  /* 4-square grid = "Home dashboard" icon */
  const c = active ? '#fff' : 'rgba(255,255,255,0.4)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/>
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.8"/>
    </svg>
  );
}
function TabAssignments({ active }: { active: boolean }) {
  /* Calendar-ish / assignment icon */
  const c = active ? '#fff' : 'rgba(255,255,255,0.4)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={c} strokeWidth="1.8"/>
      <path d="M3 9h18" stroke={c} strokeWidth="1.8"/>
      <path d="M8 2v3M16 2v3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7 13h4M7 16.5h7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function TabLibrary({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.4)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6M16 13H8M16 17H8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function TabAI({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.4)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={c}>
      {/* Sparkle / AI star — matches the image */}
      <path d="M12 2C12 2 13.2 7.5 13.2 12C13.2 16.5 12 22 12 22C12 22 10.8 16.5 10.8 12C10.8 7.5 12 2 12 2Z"/>
      <path d="M2 12C2 12 7.5 10.8 12 10.8C16.5 10.8 22 12 22 12C22 12 16.5 13.2 12 13.2C7.5 13.2 2 12 2 12Z"/>
      <path d="M5.5 5.5C5.5 5.5 9.2 9.5 12 12C14.8 14.5 18.5 18.5 18.5 18.5C18.5 18.5 14.8 14.5 12 12C9.2 9.5 5.5 5.5 5.5 5.5Z"/>
      <path d="M18.5 5.5C18.5 5.5 14.8 9.5 12 12C9.2 14.5 5.5 18.5 5.5 18.5C5.5 18.5 9.2 14.5 12 12C14.8 9.5 18.5 5.5 18.5 5.5Z"/>
    </svg>
  );
}

const tabIcons: Record<string, (props: { active: boolean }) => React.ReactElement> = {
  home:        TabHome,
  assignments: TabAssignments,
  library:     TabLibrary,
  toolkit:     TabAI,
};

/* ─────────────────────────────────────────
   VedaAI logo mark
───────────────────────────────────────── */
function AppIcon() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#F47A3A] to-[#D45E3E] shadow-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5 4l7 16 7-16" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   Bell icon (reusable)
───────────────────────────────────────── */
function BellButton({ light = false }: { light?: boolean }) {
  const stroke = light ? '#fff' : '#111';
  const bg = light ? 'bg-white/10' : 'bg-[#F5F5F5]';
  return (
    <div className="relative">
      <button className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#FF5623]" />
    </div>
  );
}

/* ─────────────────────────────────────────
   Sidebar link (desktop)
───────────────────────────────────────── */
function SidebarLink({ navKey, label, href, activeKey }: {
  navKey: NavKey; label: string; href: string; activeKey: NavKey;
}) {
  const active = activeKey === navKey;
  const Icon = sidebarIcons[navKey];
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
        active ? 'bg-[#F0F0F0] text-[#111]' : 'text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#111]'
      }`}
    >
      <Icon active={active} />
      <span>{label}</span>
    </Link>
  );
}

/* ─────────────────────────────────────────
   Floating pill bottom tab bar (mobile)
   — dark pill, centered, floating above page
───────────────────────────────────────── */
function MobileTabBar({ activeNav }: { activeNav: NavKey }) {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-5 lg:hidden">
      <nav
        className="flex items-center rounded-[28px] bg-[#1C1C1E] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}
      >
        {mobileNav.map(({ key, label, href }) => {
          const active = activeNav === key;
          const Icon = tabIcons[key];
          return (
            <Link
              key={key}
              href={href}
              className={`flex min-w-[72px] flex-col items-center gap-[3px] rounded-[22px] px-3 py-2 transition-colors ${
                active ? 'bg-white/10' : ''
              }`}
            >
              <Icon active={active} />
              <span
                className={`text-[10px] font-semibold leading-none tracking-tight ${
                  active ? 'text-white' : 'text-white/40'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ─────────────────────────────────────────
   Mobile: top brand header
───────────────────────────────────────── */
function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[#E8E8E8] bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <AppIcon />
        <span className="text-[18px] font-bold tracking-tight text-[#111]">VedaAI</span>
      </div>
      <div className="flex items-center gap-2">
        <BellButton />
        <div className="h-8 w-8 overflow-hidden rounded-full bg-[#E0D6F0]">
          <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#6B4E9E]">JD</div>
        </div>
        {/* Hamburger */}
        <button className="flex h-9 w-9 items-center justify-center">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <path d="M1 1h18M1 7h18M1 13h18" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   Mobile: page sub-header row
───────────────────────────────────────── */
function MobilePageHeader({ title, showBack, backHref }: {
  title: string; showBack: boolean; backHref: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#E8E8E8] bg-white px-4 py-3 lg:hidden">
      {showBack && (
        <Link
          href={backHref}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#111]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}
      <span className="text-[15px] font-semibold text-[#111]">{title}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main AppShell
───────────────────────────────────────── */
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
    <div className="flex h-screen w-full flex-col bg-[#EBEBEB] overflow-hidden print:h-auto print:bg-white print:overflow-visible">

      {/* ══ MOBILE LAYOUT (< lg) ══════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden print:hidden">
        <MobileHeader />
        <MobilePageHeader title={mobileTitle ?? title} showBack={showBack} backHref={backHref} />

        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '110px' }}>
          {/* Page heading */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <h1 className="text-[17px] font-bold text-[#111]">{mobileTitle ?? title}</h1>
            </div>
            {subtitle && <p className="mt-0.5 pl-4 text-[12px] text-[#888]">{subtitle}</p>}
          </div>
          {topAction && <div className="mb-4">{topAction}</div>}
          <main>{children}</main>
        </div>

        <MobileTabBar activeNav={activeNav} />
      </div>

      {/* ══ DESKTOP LAYOUT (≥ lg) ════════════════════ */}
      <div className="hidden flex-1 lg:flex overflow-hidden print:flex print:overflow-visible">

        {/* ── Sidebar ── */}
        <aside className="flex w-[240px] shrink-0 flex-col justify-between bg-white px-4 py-6 shadow-[2px_0_8px_rgba(0,0,0,0.05)] overflow-y-auto print:hidden">
          <div className="flex flex-col gap-7">

            {/* Logo */}
            <div className="flex items-center gap-2.5 px-1">
              <AppIcon />
              <span className="text-[21px] font-bold tracking-tight text-[#111]">VedaAI</span>
            </div>

            {/* ★ Create Assignment button — orange gradient border, dark fill, sparkle icon */}
            <Link
              href="/assignments/new"
              className="group relative flex items-center justify-center gap-2.5 rounded-full px-4 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #2A2A2A 0%, #1C1C1E 100%)',
                boxShadow: '0 0 0 2.5px #FF5623, 0 4px 16px rgba(255,86,35,0.25)',
              }}
            >
              <SparkleIcon size={16} color="white" />
              <span>Create Assignment</span>
            </Link>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5">
              {sidebarNav.map(({ key, label, href }) => (
                <SidebarLink key={key} navKey={key} label={label} href={href} activeKey={activeNav} />
              ))}
            </nav>
          </div>

          {/* Bottom: Settings + school card */}
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#111]">
              <IconSettings />
              Settings
            </button>
            <div className="flex items-center gap-3 rounded-2xl bg-[#F5F5F5] p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#FFDAB0] to-[#F0A87A] text-sm font-bold text-[#7A3A1E]">
                DP
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#111]">Delhi Public School</p>
                <p className="truncate text-[11px] text-[#888]">Bokaro Steel City</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between bg-white px-6 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] print:hidden">
            <div className="flex items-center gap-3">
              {showBack && (
                <Link
                  href={backHref}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-[#111] transition hover:bg-[#EBEBEB]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
              <span className="text-[13px] font-medium text-[#999]">
                {showBack ? title : 'Assignment'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BellButton />
              {/* User pill */}
              <button className="flex items-center gap-2 rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 transition hover:bg-[#F5F5F5]">
                <div className="h-6 w-6 overflow-hidden rounded-full bg-[#E0D6F0]">
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#6B4E9E]">JD</div>
                </div>
                <span className="text-[13px] font-semibold text-[#111]">John Doe</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto p-6">
            <header className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  <h1 className="text-[22px] font-bold text-[#111]">{title}</h1>
                </div>
                {subtitle && <p className="mt-0.5 pl-4 text-[13px] text-[#888]">{subtitle}</p>}
              </div>
              {topAction && <div className="shrink-0">{topAction}</div>}
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
