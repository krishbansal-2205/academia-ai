import Link from 'next/link';

export function EmptyAssignmentsState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Illustration — magnifying glass with X */}
      <div className="relative h-44 w-44">
        {/* Outer circle background */}
        <div className="absolute inset-0 rounded-full bg-[#F0EBF8] opacity-60" />
        {/* Document behind */}
        <div className="absolute left-[18%] top-[12%] h-[58%] w-[44%] rounded-xl bg-white shadow-md" />
        {/* Magnifying glass circle */}
        <div className="absolute left-[30%] top-[22%] h-[50%] w-[50%] rounded-full border-[10px] border-[#CEC6E0] bg-[#FFF5F5]" />
        {/* X mark */}
        <div className="absolute left-[44%] top-[36%] flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3B30] text-white font-bold text-base">
          ✕
        </div>
        {/* Handle */}
        <div
          className="absolute bottom-[15%] right-[15%] h-[28%] w-[10%] origin-top-right rounded-full bg-[#7B5EA7]"
          style={{ transform: 'rotate(-45deg)' }}
        />
        {/* Sparkles */}
        <div className="absolute left-[8%] top-[8%] text-[#B0B0C0] text-sm">✦</div>
        <div className="absolute right-[8%] top-[20%] text-[#B0B0C0] text-xs">✦</div>
        <div className="absolute bottom-[18%] left-[14%] text-[#B0B0C0] text-[10px]">✦</div>
      </div>

      <div className="max-w-[320px] space-y-2">
        <h2 className="text-[18px] font-bold text-[#111]">No assignments yet</h2>
        <p className="text-[13px] leading-relaxed text-[#888]">
          Create your first assignment to start collecting and grading student submissions.
          You can set up rubrics, define marking criteria, and let AI assist with grading.
        </p>
      </div>

      <Link
        href="/assignments/new"
        className="inline-flex items-center gap-2 rounded-full bg-[#1C1C1E] px-6 py-3 text-[13px] font-semibold text-white shadow-md transition hover:bg-[#2D2D2F]"
      >
        <span className="text-base leading-none">+</span>
        Create Your First Assignment
      </Link>
    </div>
  );
}
