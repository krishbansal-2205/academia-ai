'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';
import { AssignmentCard } from '../assignments/assignment-card';
import { EmptyAssignmentsState } from '../assignments/empty-state';
import { AppShell } from '../shell/app-shell';
import { useAssignmentsStore } from '../../stores/use-assignments-store';

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[120px] animate-pulse rounded-2xl bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

export function AssignmentsDashboardPage() {
  const assignments = useAssignmentsStore((state) => state.assignments);
  const isListLoading = useAssignmentsStore((state) => state.isListLoading);
  const error = useAssignmentsStore((state) => state.error);
  const fetchAssignments = useAssignmentsStore((state) => state.fetchAssignments);
  const clearError = useAssignmentsStore((state) => state.clearError);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredAssignments = normalizedQuery
    ? assignments.filter((assignment) =>
        [assignment.title, assignment.subject, assignment.materialFileName ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : assignments;

  return (
    <AppShell
      activeNav="assignments"
      title="Assignments"
      subtitle="Manage and create assignments for your classes."
    >
      <div className="space-y-4">
        {/* ── Search + Filter row ── */}
        <div className="flex items-center gap-2">
          {/* Search input — full width on mobile, flex-1 on desktop */}
          <div className="relative flex flex-1 items-center">
            {/* Search icon */}
            <span className="pointer-events-none absolute left-3.5 flex items-center text-[#999]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              value={searchQuery}
              onChange={(event) => {
                if (error) clearError();
                setSearchQuery(event.target.value);
              }}
              placeholder="Search Assignment"
              className="w-full rounded-full border border-[#E0E0E0] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#111] shadow-sm outline-none transition focus:border-[#999] placeholder:text-[#BBB]"
            />
          </div>

          {/* Filter button — pill */}
          <button className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E0E0E0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#555] shadow-sm transition hover:bg-[#F5F5F5]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Filter By</span>
          </button>
        </div>

        {/* ── Error ── */}
        {error ? (
          <div className="rounded-2xl border border-[#FFD7D7] bg-[#FFF1F1] px-4 py-3 text-[13px] text-[#A23A3A]">
            {error}
          </div>
        ) : null}

        {/* ── Loading skeleton ── */}
        {isListLoading ? <DashboardSkeleton /> : null}

        {/* ── Empty state ── */}
        {!isListLoading && assignments.length === 0 ? <EmptyAssignmentsState /> : null}

        {/* ── Filled: grid of cards ── */}
        {!isListLoading && assignments.length > 0 ? (
          filteredAssignments.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </section>
          ) : (
            <div className="rounded-2xl bg-white px-6 py-10 text-center text-[13px] text-[#888]">
              No assignments match &ldquo;{deferredSearchQuery}&rdquo;.
            </div>
          )
        ) : null}
      </div>

      {/* ── Mobile FAB: clean orange circle with + ── */}
      <Link
        href="/assignments/new"
        aria-label="Create Assignment"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition hover:scale-105 active:scale-95 lg:hidden"
        style={{ boxShadow: '0 0 0 2px #FF5623, 0 6px 20px rgba(255,86,35,0.25)' }}
      >
        <span className="text-3xl font-light leading-none text-[#FF5623]">+</span>
      </Link>
    </AppShell>
  );
}
