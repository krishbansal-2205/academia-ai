'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState, useTransition } from 'react';
import { toast } from 'sonner';
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
    (summary, qt) => ({
      totalQuestions: summary.totalQuestions + qt.count,
      totalMarks: summary.totalMarks + qt.count * qt.marks,
    }),
    { totalQuestions: 0, totalMarks: 0 }
  );

  const availableTypes = QUESTION_TYPE_OPTIONS.filter(
    (option) => !questionTypes.some((qt) => qt.type === option.value)
  );

  function validate(): boolean {
    const nextErrors: ValidationErrors = {};
    if (!file) nextErrors.file = 'Upload a file to generate a paper from source material.';
    if (!dueDate) nextErrors.dueDate = 'Choose a due date.';
    else if (Number.isNaN(new Date(dueDate).getTime())) nextErrors.dueDate = 'Enter a valid due date.';
    if (questionTypes.length === 0 || questionTypes.some((qt) => qt.count <= 0 || qt.marks <= 0))
      nextErrors.questionTypes = 'Question types, counts, and marks must all be positive.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const formData = new FormData();
    if (file) formData.append('file', file);
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
        startTransition(() => { router.push(`/assignments/${assignment.id}`); });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create assignment';
        setSubmitError(errorMessage);
        if (errorMessage.toLowerCase().includes('rate limit')) {
          toast.error(errorMessage);
        }
      }
    });
  }

  return (
    <AppShell
      activeNav="assignments"
      title="Create Assignment"
      subtitle="Set up a new assignment for your students."
      mobileTitle="Create Assignment"
      showBack
      backHref="/"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto w-full max-w-[760px]"
      >
        {/* ── Card wrapper ── */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-6 lg:p-8">

          {/* Section header */}
          <div className="mb-5">
            <h2 className="text-[15px] font-bold text-[#111]">Assignment Details</h2>
            <p className="mt-0.5 text-[12.5px] text-[#888]">Basic information about your assignment</p>
          </div>

          <div className="space-y-5">
            {/* ── File upload ── */}
            <div className="space-y-2">
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files?.[0] ?? null;
                  setField('file', dropped);
                  setErrors((c) => ({ ...c, file: undefined }));
                }}
                className={`flex flex-col items-center cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                  isDragging ? 'border-[#FF5623] bg-orange-50' : 'border-[#DEDEDE] bg-[#FAFAFA]'
                }`}
              >
                {/* Upload icon */}
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* File name or placeholder */}
                {file ? (
                  <div className="space-y-1">
                    <p className="text-[13.5px] font-semibold text-[#111]">{file.name}</p>
                    <p className="text-[12px] text-[#22C55E]">File selected ✓</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[13.5px] font-semibold text-[#111]">
                      Choose a file or drag &amp; drop it here
                    </p>
                    <p className="text-[12px] text-[#999]">JPEG, PNG, upto 10MB</p>
                  </div>
                )}

                <div className="mt-4 rounded-full border border-[#D0D0D0] bg-white px-5 py-2 text-[12.5px] font-semibold text-[#111] transition hover:bg-[#F5F5F5]">
                  Browse Files
                </div>
                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,image/*,text/plain,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    setField('file', e.target.files?.[0] ?? null);
                    setErrors((c) => ({ ...c, file: undefined }));
                  }}
                />
              </label>
              <p className="text-[11.5px] text-[#AAA]">
                Upload images of your preferred document/image
              </p>
              {errors.file && <p className="text-[12px] text-[#E53935]">{errors.file}</p>}
            </div>

            {/* ── Due Date ── */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#111]">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  placeholder="DD-MM-YYYY"
                  onChange={(e) => {
                    setField('dueDate', e.target.value);
                    setErrors((c) => ({ ...c, dueDate: undefined }));
                  }}
                  className="w-full appearance-none rounded-xl border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 pr-10 text-[13px] text-[#111] outline-none transition focus:border-[#111] placeholder:text-[#BBB]"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#888]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
              {errors.dueDate && <p className="text-[12px] text-[#E53935]">{errors.dueDate}</p>}
            </div>

            {/* ── Question Type ── */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-[#111]">Question Type</h3>
              </div>
              <QuestionTypeEditor
                questionTypes={questionTypes}
                onAdd={(type) => addQuestionType(type)}
                onUpdate={updateQuestionType}
                onRemove={removeQuestionType}
              />
              {errors.questionTypes && (
                <p className="text-[12px] text-[#E53935]">{errors.questionTypes}</p>
              )}

              {/* Totals */}
              <div className="flex flex-col items-end gap-1 text-right text-[12.5px] font-semibold text-[#555]">
                <p>Total Questions : {totals.totalQuestions}</p>
                <p>Total Marks : {totals.totalMarks}</p>
              </div>
            </div>

            {/* ── Additional Information ── */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#111]">
                Additional Information (For better output)
              </label>
              <div className="relative">
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setField('additionalInstructions', e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="min-h-[100px] w-full resize-none rounded-xl border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 pr-10 text-[13px] leading-relaxed text-[#111] outline-none transition focus:border-[#111] placeholder:text-[#BBB]"
                />
                {/* Mic icon */}
                <span className="pointer-events-none absolute bottom-3 right-3 text-[#BBB]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* ── Submit error ── */}
            {submitError && (
              <div className="rounded-xl border border-[#FFD7D7] bg-[#FFF1F1] px-4 py-3 text-[13px] text-[#A23A3A]">
                {submitError}
              </div>
            )}

            {/* ── Action buttons ── */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#111] transition hover:bg-[#F5F5F5]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Previous
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#1C1C1E] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2D2D2F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Generating...' : 'Next'}
                {!isPending && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
