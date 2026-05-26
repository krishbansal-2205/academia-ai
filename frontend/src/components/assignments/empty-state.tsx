import Link from 'next/link';

export function EmptyAssignmentsState() {
  return (
    <div className="grid min-h-[620px] place-items-center rounded-[36px] bg-transparent px-4">
      <div className="flex max-w-[520px] flex-col items-center gap-8 text-center">
        <div className="relative grid h-[280px] w-[280px] place-items-center">
          <div className="absolute inset-6 rounded-full bg-[linear-gradient(180deg,#F2F2F2_-15%,#EFEFEF_160%)]" />
          <div className="absolute left-16 top-16 h-40 w-32 rounded-[24px] bg-white shadow-[0_26px_40px_rgba(146,146,146,0.2)]" />
          <div className="absolute left-[110px] top-[104px] h-[116px] w-[116px] rounded-full border-[16px] border-[#E1DCEB] bg-[linear-gradient(158deg,#FFFFFF_14%,#FFADAD_122%)]" />
          <div className="absolute left-[144px] top-[138px] grid h-[48px] w-[48px] place-items-center rounded-full bg-[#FF4040] text-3xl font-semibold text-white">
            ×
          </div>
          <div className="absolute left-7 top-24 h-16 w-16 rounded-[22px] bg-[#011625]" />
          <div className="absolute right-5 top-12 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[6px_4px_13px_rgba(27,119,139,0.09)]">
            <span className="h-3 w-3 rounded-full bg-[#CCC6D9]" />
            <span className="h-3 w-8 rounded-full bg-[#D5D5D5]" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-bricolage)] text-[26px] font-bold tracking-[-0.04em] text-[#303030]">
            No assignments yet
          </h2>
          <p className="text-base leading-7 text-[#5E5E5ECC]">
            Create your first assignment to start generating structured question papers from
            your teaching material, complete with AI-powered sections, difficulty tags, and
            downloadable PDFs.
          </p>
        </div>

        <Link
          href="/assignments/new"
          className="rounded-full bg-[#181818] px-7 py-3 text-sm font-semibold text-white shadow-[0_22px_48px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
        >
          Create Your First Assignment
        </Link>
      </div>
    </div>
  );
}
