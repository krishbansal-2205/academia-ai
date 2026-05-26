import Link from 'next/link';
import type { Assignment } from '../../lib/types';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function statusTone(status: Assignment['status']): string {
  if (status === 'completed') {
    return 'bg-[#EAF8EE] text-[#1F7A3D]';
  }

  if (status === 'failed') {
    return 'bg-[#FFECEC] text-[#C53535]';
  }

  return 'bg-[#FFF3EA] text-[#C4651A]';
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className="group flex flex-col gap-6 rounded-[28px] bg-white/80 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex rounded-full bg-[#F6F6F6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5E5E5E]">
            {assignment.subject}
          </div>
          <h3 className="font-[family-name:var(--font-bricolage)] text-[24px] font-bold tracking-[-0.05em] text-[#303030]">
            {assignment.title}
          </h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(assignment.status)}`}>
          {assignment.status === 'processing' ? 'Generating' : assignment.status}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-[#5E5E5E] sm:grid-cols-2">
        <p>
          <span className="font-semibold text-[#303030]">Assigned on:</span> {formatDate(assignment.createdAt)}
        </p>
        <p>
          <span className="font-semibold text-[#303030]">Due:</span> {formatDate(assignment.dueDate)}
        </p>
        <p>
          <span className="font-semibold text-[#303030]">Questions:</span> {assignment.totalQuestions}
        </p>
        <p>
          <span className="font-semibold text-[#303030]">Marks:</span> {assignment.totalMarks}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {assignment.questionTypes.map((questionType) => (
          <span
            key={`${assignment.id}-${questionType.type}`}
            className="rounded-full bg-[#F0F0F0] px-3 py-1 text-xs font-medium text-[#5E5E5E]"
          >
            {questionType.type.toUpperCase()} · {questionType.count} × {questionType.marks}
          </span>
        ))}
      </div>

      <div className="text-sm font-semibold text-[#303030] transition group-hover:translate-x-1">
        {assignment.status === 'completed' ? 'View generated paper →' : 'Track generation →'}
      </div>
    </Link>
  );
}
