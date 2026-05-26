import type { Assignment, Difficulty, GeneratedPaper } from '../../lib/types';

function difficultyClasses(difficulty: Difficulty): string {
  if (difficulty === 'Easy') {
    return 'bg-[#EAF8EE] text-[#227B3E]';
  }

  if (difficulty === 'Hard') {
    return 'bg-[#FFECEC] text-[#C53535]';
  }

  return 'bg-[#FFF4E6] text-[#B4671E]';
}

export function QuestionPaperPreview({
  assignment,
  paper,
}: {
  assignment: Assignment;
  paper: GeneratedPaper;
}) {
  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_20px_48px_rgba(0,0,0,0.1)] xl:p-8">
      <div className="mx-auto max-w-[996px] space-y-8">
        <header className="space-y-5 border-b border-[#E8E8E8] pb-8 text-center">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-paper)] text-[28px] font-bold leading-[1.45] tracking-[-0.04em] xl:text-[36px]">
              {paper.institutionName}
            </h2>
            <p className="font-[family-name:var(--font-paper)] text-lg font-semibold tracking-[-0.04em] xl:text-[22px]">
              Subject: {paper.subject}
            </p>
            <p className="font-[family-name:var(--font-paper)] text-lg font-semibold tracking-[-0.04em] xl:text-[22px]">
              Class: {paper.className}
            </p>
          </div>

          <div className="font-[family-name:var(--font-paper)] text-xl font-bold tracking-[-0.04em] xl:text-[28px]">
            {paper.examTitle}
          </div>

          <div className="grid gap-3 font-[family-name:var(--font-paper)] text-sm font-semibold tracking-[-0.04em] text-[#303030] sm:grid-cols-3 xl:text-lg">
            <div>Time Allowed: {paper.duration}</div>
            <div>Maximum Marks: {paper.totalMarks}</div>
            <div>Due Date: {new Intl.DateTimeFormat('en-IN').format(new Date(assignment.dueDate))}</div>
          </div>

          <p className="font-[family-name:var(--font-paper)] text-left text-sm font-semibold leading-7 tracking-[-0.04em] xl:text-lg">
            {paper.generalInstructions}
          </p>
        </header>

        <section className="space-y-4">
          <div className="grid gap-4 font-[family-name:var(--font-paper)] text-base font-semibold tracking-[-0.04em] text-[#303030] md:grid-cols-3 xl:text-xl">
            <label className="space-y-2">
              <span>Name</span>
              <div className="border-b border-dashed border-[#B5B5B5] pb-3" />
            </label>
            <label className="space-y-2">
              <span>Roll Number</span>
              <div className="border-b border-dashed border-[#B5B5B5] pb-3" />
            </label>
            <label className="space-y-2">
              <span>Section</span>
              <div className="border-b border-dashed border-[#B5B5B5] pb-3" />
            </label>
          </div>
        </section>

        <section className="space-y-10">
          {paper.sections.map((section) => (
            <article key={section.title} className="space-y-5">
              <div className="space-y-3 text-center">
                <h3 className="font-[family-name:var(--font-paper)] text-2xl font-semibold tracking-[-0.04em] xl:text-[30px]">
                  {section.title}
                </h3>
                <p className="font-[family-name:var(--font-paper)] text-left text-sm font-semibold leading-7 tracking-[-0.04em] xl:text-lg">
                  {section.instruction}
                </p>
              </div>

              <div className="space-y-5">
                {section.questions.map((question) => (
                  <div
                    key={`${section.title}-${question.number}`}
                    className="rounded-[24px] border border-[#EFEFEF] bg-[#FCFCFC] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-3">
                        <p className="font-[family-name:var(--font-paper)] text-base leading-8 tracking-[-0.04em] text-[#303030] xl:text-lg">
                          <span className="font-semibold">{question.number}.</span> {question.text}
                        </p>

                        {question.options?.length ? (
                          <div className="grid gap-3 font-[family-name:var(--font-paper)] text-sm leading-7 tracking-[-0.03em] text-[#303030] md:grid-cols-2 xl:text-base">
                            {question.options.map((option) => (
                              <div key={option} className="rounded-2xl bg-white px-4 py-3">
                                {option}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${difficultyClasses(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </span>
                        <span className="rounded-full bg-[#303030] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                          {question.marks} Marks
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
