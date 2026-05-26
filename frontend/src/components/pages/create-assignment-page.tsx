'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState, useTransition } from 'react';
import { createAssignment } from '../../lib/api';
import { QUESTION_TYPE_OPTIONS } from '../../lib/types';
import { useAssignmentBuilderStore } from '../../stores/use-assignment-builder-store';
import { useAssignmentsStore } from '../../stores/use-assignments-store';
import { QuestionTypeEditor } from '../assignments/question-type-editor';
import { AppShell } from '../shell/app-shell';

interface ValidationErrors {
  file?: string;
  dueDate?: string;
  questionTypes?: string;
}

function fileHint(fileName: string | null): string {
  return fileName ?? 'Choose a PDF or text file, or drag and drop it here';
}

export function CreateAssignmentPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const title = useAssignmentBuilderStore((state) => state.title);
  const subject = useAssignmentBuilderStore((state) => state.subject);
  const dueDate = useAssignmentBuilderStore((state) => state.dueDate);
  const additionalInstructions = useAssignmentBuilderStore((state) => state.additionalInstructions);
  const questionTypes = useAssignmentBuilderStore((state) => state.questionTypes);
  const file = useAssignmentBuilderStore((state) => state.file);
  const setField = useAssignmentBuilderStore((state) => state.setField);
  const addQuestionType = useAssignmentBuilderStore((state) => state.addQuestionType);
  const updateQuestionType = useAssignmentBuilderStore((state) => state.updateQuestionType);
  const removeQuestionType = useAssignmentBuilderStore((state) => state.removeQuestionType);
  const reset = useAssignmentBuilderStore((state) => state.reset);
  const upsertAssignment = useAssignmentsStore((state) => state.upsertAssignment);

  const totals = questionTypes.reduce(
    (summary, questionType) => ({
      totalQuestions: summary.totalQuestions + questionType.count,
      totalMarks: summary.totalMarks + questionType.count * questionType.marks,
    }),
    { totalQuestions: 0, totalMarks: 0 }
  );

  const availableTypes = QUESTION_TYPE_OPTIONS.filter(
    (option) => !questionTypes.some((questionType) => questionType.type === option.value)
  );

  function validate(): boolean {
    const nextErrors: ValidationErrors = {};

    if (!file) {
      nextErrors.file = 'Upload a PDF or text file to generate a paper from source material.';
    }

    if (!dueDate) {
      nextErrors.dueDate = 'Choose a due date.';
    } else if (Number.isNaN(new Date(dueDate).getTime())) {
      nextErrors.dueDate = 'Enter a valid due date.';
    }

    if (
      questionTypes.length === 0 ||
      questionTypes.some((questionType) => questionType.count <= 0 || questionType.marks <= 0)
    ) {
      nextErrors.questionTypes = 'Question types, counts, and marks must all be positive.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('dueDate', dueDate);
    formData.append('questionTypes', JSON.stringify(questionTypes));
    formData.append('totalQuestions', String(totals.totalQuestions));
    formData.append('totalMarks', String(totals.totalMarks));
    formData.append('additionalInstructions', additionalInstructions);

    startSubmitTransition(async () => {
      try {
        const assignment = await createAssignment(formData);
        upsertAssignment(assignment);
        reset();

        startTransition(() => {
          router.push(`/assignments/${assignment.id}`);
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to create assignment');
      }
    });
  }

  return (
    <AppShell
      activeNav="create"
      title="Create Assignment"
      subtitle="Set up a new assignment for your students."
      mobileTitle="Create Assignment"
      showBack
      backHref="/"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto w-full max-w-[810px] rounded-[32px] bg-white/50 p-4 shadow-[0_22px_52px_rgba(0,0,0,0.08)] sm:p-6 xl:p-8"
      >
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="font-[family-name:var(--font-bricolage)] text-[22px] font-bold tracking-[-0.05em]">
              Assignment Details
            </h2>
            <p className="text-sm text-[#5E5E5ECC]">Basic information about your assignment</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold">Assignment Title</span>
              <input
                value={title}
                onChange={(event) => setField('title', event.target.value)}
                placeholder="Optional: AI will derive this if left blank"
                className="w-full rounded-full border border-[#DADADA] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#303030]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Subject</span>
              <input
                value={subject}
                onChange={(event) => setField('subject', event.target.value)}
                placeholder="Optional: e.g. Science"
                className="w-full rounded-full border border-[#DADADA] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#303030]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const droppedFile = event.dataTransfer.files?.[0] ?? null;
                setField('file', droppedFile);
                setErrors((current) => ({ ...current, file: undefined }));
              }}
              className={`rounded-[24px] border-[1.75px] border-dashed p-8 text-center transition ${
                isDragging ? 'border-[#303030] bg-white' : 'border-black/20 bg-white'
              }`}
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-lg shadow-sm">
                ☁
              </div>
              <div className="mt-4 space-y-1">
                <p className="font-medium text-[#303030]">{fileHint(file?.name ?? null)}</p>
                <p className="text-sm text-[#A9A9A9]">PDF or TXT, up to 10MB</p>
              </div>
              <label className="mt-5 inline-flex cursor-pointer items-center rounded-full bg-[#F6F6F6] px-5 py-2 text-sm font-semibold">
                Choose File
                <input
                  type="file"
                  accept=".pdf,.txt,text/plain,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    setField('file', event.target.files?.[0] ?? null);
                    setErrors((current) => ({ ...current, file: undefined }));
                  }}
                />
              </label>
            </div>
            <p className="text-sm text-[#30303099]">
              Upload material that you want the AI to use as the primary source for the assessment.
            </p>
            {errors.file ? <p className="text-sm text-[#C53535]">{errors.file}</p> : null}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold">Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => {
                setField('dueDate', event.target.value);
                setErrors((current) => ({ ...current, dueDate: undefined }));
              }}
              className="w-full rounded-full border border-[#DADADA] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#303030]"
            />
            {errors.dueDate ? <p className="text-sm text-[#C53535]">{errors.dueDate}</p> : null}
          </label>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Question Type</h3>
              <p className="text-sm text-[#5E5E5ECC]">
                Balance counts and marks for each section of the generated paper.
              </p>
            </div>

            <QuestionTypeEditor
              questionTypes={questionTypes}
              onAdd={(type) => addQuestionType(type)}
              onUpdate={updateQuestionType}
              onRemove={removeQuestionType}
            />

            {errors.questionTypes ? <p className="text-sm text-[#C53535]">{errors.questionTypes}</p> : null}

            <div className="flex flex-col items-end gap-2 text-right text-sm font-semibold">
              <p>Total Questions: {totals.totalQuestions}</p>
              <p>Total Marks: {totals.totalMarks}</p>
              {availableTypes.length === 0 ? (
                <p className="text-xs font-medium text-[#5E5E5E]">All question type options are already in use.</p>
              ) : null}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold">Additional Information (For better output)</span>
            <textarea
              value={additionalInstructions}
              onChange={(event) => setField('additionalInstructions', event.target.value)}
              placeholder="e.g. Generate a question paper for a 3 hour exam duration with a strong focus on application-based questions."
              className="min-h-[112px] w-full rounded-[20px] border border-dashed border-[#DADADA] bg-white/50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-[#303030]"
            />
          </label>

          {submitError ? (
            <div className="rounded-[18px] border border-[#FFD7D7] bg-[#FFF1F1] px-4 py-3 text-sm text-[#A23A3A]">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#303030] shadow-[0_10px_24px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5"
            >
              ← Previous
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? 'Generating...' : 'Continue'}
              <span>→</span>
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
