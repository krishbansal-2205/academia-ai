'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Assignment } from '../../lib/types';
import { useAssignmentsStore } from '../../stores/use-assignments-store';

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const deleteAssignment = useAssignmentsStore((state) => state.deleteAssignment);
  const router = useRouter();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    startDelete(async () => {
      await deleteAssignment(assignment.id);
    });
  }

  return (
    <div className={`relative rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition ${
      isDeleting ? 'opacity-50 pointer-events-none' : 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]'
    }`}>
      <Link href={`/assignments/${assignment.id}`} className="block p-5">
        {/* Title + kebab row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-bold leading-snug text-[#111]">
            {assignment.title || 'Untitled Assignment'}
          </h3>
          <button
            aria-label="More options"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#888] transition hover:bg-[#F5F5F5]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            {/* Vertical ellipsis ⋮ */}
            <svg width="4" height="16" viewBox="0 0 4 18" fill="currentColor">
              <circle cx="2" cy="2" r="2"/>
              <circle cx="2" cy="9" r="2"/>
              <circle cx="2" cy="16" r="2"/>
            </svg>
          </button>
        </div>

        {/* Date row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-1 text-[12.5px] text-[#888]">
          <span>
            <span className="font-semibold text-[#111]">Assigned on :</span>{' '}
            {formatDate(assignment.createdAt)}
          </span>
          <span>
            <span className="font-semibold text-[#111]">Due :</span>{' '}
            {formatDate(assignment.dueDate)}
          </span>
        </div>
      </Link>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          {/* Click-away */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-10 z-20 min-w-[160px] overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-black/5">
            <Link
              href={`/assignments/${assignment.id}`}
              className="flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-[#111] hover:bg-[#F5F5F5]"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              View Assignment
            </Link>
            <div className="mx-3 h-px bg-[#F0F0F0]" />
            <button
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] font-medium text-[#E53935] hover:bg-[#FFF5F5] disabled:opacity-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
