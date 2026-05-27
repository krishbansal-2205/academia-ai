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
        <div className="flex w-full items-center justify-between rounded-[24px] bg-white px-2 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Left: Filter button */}
          <button className="flex shrink-0 items-center gap-2 pl-4 pr-3 text-[13px] font-medium text-[#777] transition hover:text-[#111]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filter By
          </button>
          
          {/* Right: Search input (pill shaped) */}
          <label className="flex w-full max-w-[280px] items-center gap-2.5 rounded-full border border-[#E8E8E8] px-4 py-2.5 transition focus-within:border-[#999]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-[#999] shrink-0">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              value={searchQuery}
              onChange={(event) => {
                if (error) clearError();
                setSearchQuery(event.target.value);
              }}
              placeholder="Search Assignment"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111] outline-none placeholder:text-[#BBB]"
            />
          </label>
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

      {/* ── Floating "Create Assignment" FAB (Only if assignments exist) ── */}
      {!isListLoading && assignments.length > 0 && (
        <>
          {/* Mobile FAB: White circle with thick orange + */}
          <Link
            href="/assignments/new"
            aria-label="Create Assignment"
            className="fixed bottom-24 right-5 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FFFFFF] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition hover:scale-105 active:scale-95 lg:hidden"
          >
            <div className="relative h-[22px] w-[22px]">
              <div className="absolute left-1/2 top-0 h-full w-[2.5px] -translate-x-1/2 rounded-full bg-[#FF5623]"></div>
              <div className="absolute left-0 top-1/2 h-[2.5px] w-full -translate-y-1/2 rounded-full bg-[#FF5623]"></div>
            </div>
          </Link>

          {/* Desktop FAB: Black pill, centered horizontally EXCLUDING the 240px sidebar */}
          <Link
            href="/assignments/new"
            aria-label="Create Assignment"
            className="fixed bottom-10 left-[calc(50%+120px)] z-40 hidden -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#1C1C1E] px-6 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition hover:scale-105 active:scale-95 lg:flex"
          >
            <span className="text-lg font-light leading-none text-[#FFFFFF]">+</span>
            <span className="text-[13.5px] font-semibold text-[#FFFFFF]">Create Assignment</span>
          </Link>
        </>
      )}
    </AppShell>
  );
}
