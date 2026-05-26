'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';
import { AssignmentCard } from '../assignments/assignment-card';
import { EmptyAssignmentsState } from '../assignments/empty-state';
import { AppShell } from '../shell/app-shell';
import { useAssignmentsStore } from '../../stores/use-assignments-store';

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[190px] animate-pulse rounded-[28px] bg-white/60 shadow-[0_18px_44px_rgba(0,0,0,0.05)]"
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
      topAction={
        <Link
          href="/assignments/new"
          className="inline-flex items-center gap-3 rounded-full bg-[#181818] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10">+</span>
          Create Assignment
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[24px] bg-white p-4 shadow-[0_14px_36px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A9A9A9]">
            <span>⌕</span>
            Filter By
          </button>
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-black/10 px-4 py-3 sm:max-w-[380px]">
            <span className="text-[#A9A9A9]">⌕</span>
            <input
              value={searchQuery}
              onChange={(event) => {
                if (error) {
                  clearError();
                }
                setSearchQuery(event.target.value);
              }}
              placeholder="Search assignment"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#303030] outline-none placeholder:text-[#A9A9A9]"
            />
          </label>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-[#FFD7D7] bg-[#FFF1F1] px-5 py-4 text-sm text-[#A23A3A]">
            {error}
          </div>
        ) : null}

        {isListLoading ? <DashboardSkeleton /> : null}

        {!isListLoading && assignments.length === 0 ? <EmptyAssignmentsState /> : null}

        {!isListLoading && assignments.length > 0 ? (
          filteredAssignments.length > 0 ? (
            <section className="grid gap-5 xl:grid-cols-2">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </section>
          ) : (
            <div className="rounded-[28px] bg-white/75 px-6 py-10 text-center text-[#5E5E5E] shadow-[0_18px_44px_rgba(0,0,0,0.06)]">
              No assignments match “{deferredSearchQuery}”.
            </div>
          )
        ) : null}
      </div>
    </AppShell>
  );
}
