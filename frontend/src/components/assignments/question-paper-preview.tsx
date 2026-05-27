import type { Assignment, GeneratedPaper } from '../../lib/types';

/* ── Difficulty badge colours ── */
function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Easy:       'bg-[#E8F5E9] text-[#2E7D32]',
    Moderate:   'bg-[#FFF3E0] text-[#E65100]',
    Challenging:'bg-[#FFEBEE] text-[#C62828]',
    Hard:       'bg-[#FFEBEE] text-[#C62828]',
  };
  const cls = map[level] ?? 'bg-[#F5F5F5] text-[#555]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {level}
    </span>
  );
}

export function QuestionPaperPreview({
  assignment,
  paper,
}: {
  assignment: Assignment;
  paper: GeneratedPaper;
}) {
  return (
    /*
     * This wrapper is both the screen preview and the target for html2pdf.
     * We keep it white, A4-proportioned, and use Georgia/serif for the paper feel.
     */
    <div
      id="question-paper-pdf"
      className="mx-auto w-full max-w-[760px] rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] lg:p-10"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* ── Institution header ── */}
      <div className="mb-6 text-center">
        <h1 className="text-[20px] font-bold leading-snug text-[#111] lg:text-[24px]">
          {paper.institutionName}
        </h1>
        <p className="mt-1 text-[14px] font-semibold text-[#333]">
          Subject: {paper.subject}
        </p>
        <p className="text-[14px] font-semibold text-[#333]">
          Class: {paper.className}
        </p>
      </div>

      {/* ── Time + Marks row ── */}
      <div className="mb-3 flex justify-between text-[13px] font-semibold text-[#333]">
        <span>Time Allowed: {paper.duration}</span>
        <span>Maximum Marks: {paper.totalMarks}</span>
      </div>

      {/* ── General instructions ── */}
      <p className="mb-5 text-[12.5px] italic text-[#555]">
        All questions are compulsory unless stated otherwise.
      </p>

      {/* ── Student fill-in fields ── */}
      <div className="mb-6 space-y-2 text-[13px] text-[#333]">
        <div className="flex items-end gap-2">
          <span className="shrink-0 font-semibold">Name:</span>
          <div className="flex-1 border-b border-dashed border-[#AAA]" />
        </div>
        <div className="flex items-end gap-2">
          <span className="shrink-0 font-semibold">Roll Number:</span>
          <div className="flex-1 border-b border-dashed border-[#AAA]" />
        </div>
        <div className="flex items-end gap-2">
          <span className="shrink-0 font-semibold">Class:</span>
          <span className="mr-6">{paper.className}</span>
          <span className="shrink-0 font-semibold">Section:</span>
          <div className="flex-1 border-b border-dashed border-[#AAA]" />
        </div>
      </div>

      {/* ── Sections & Questions ── */}
      <div className="space-y-10">
        {paper.sections.map((section) => (
          <section key={section.title}>
            {/* Section heading */}
            <h2 className="mb-1 text-center text-[16px] font-bold text-[#111]">
              {section.title}
            </h2>
            <p className="mb-1 text-[12.5px] font-semibold text-[#444]">
              {section.instruction}
            </p>
            <p className="mb-4 text-[12px] italic text-[#777]">
              {section.instruction?.includes('marks') ? '' : `Attempt all questions. Each question carries ${section.questions[0]?.marks ?? ''} marks`}
            </p>

            <ol className="space-y-3">
              {section.questions.map((question) => (
                <li
                  key={`${section.title}-${question.number}`}
                  className="text-[13.5px] leading-relaxed text-[#222]"
                >
                  <span className="font-semibold">{question.number}. </span>
                  {question.text}
                  {' '}
                  <span className="font-semibold text-[#555]">
                    [{question.marks} Marks]
                  </span>
                  {' '}
                  {/* Difficulty badge after marks */}
                  <DifficultyBadge level={question.difficulty} />

                  {/* MCQ options */}
                  {question.options?.length ? (
                    <div className="mt-2 grid grid-cols-1 gap-1 pl-5 sm:grid-cols-2">
                      {question.options.map((option, idx) => (
                        <span key={option} className="text-[13px] text-[#444]">
                          ({String.fromCharCode(97 + idx)}) {option}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* ── End of paper ── */}
      <p className="mt-10 text-center text-[12px] font-semibold text-[#555]">
        End of Question Paper
      </p>
    </div>
  );
}
