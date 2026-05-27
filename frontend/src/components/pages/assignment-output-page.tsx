'use client';

import { useEffect, useTransition } from 'react';
import { absoluteApiUrl, prepareAssignmentPdf, regenerateAssignment } from '../../lib/api';
import { useAssignmentSubscription } from '../../hooks/use-assignment-subscription';
import { useAssignmentsStore } from '../../stores/use-assignments-store';
import { QuestionPaperPreview } from '../assignments/question-paper-preview';
import { AppShell } from '../shell/app-shell';

function outputMessage(status: string, pdfStatus: string): string {
  if (status === 'processing') return 'Your question paper is being generated from the uploaded material.';
  if (status === 'failed') return 'Generation did not complete. You can retry with the same settings.';
  if (pdfStatus === 'processing') return 'Question paper is ready. The PDF is being prepared.';
  if (pdfStatus === 'failed') return 'Question paper is ready, but the PDF export needs another attempt.';
  return 'Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:';
}

export function AssignmentOutputPage({ assignmentId }: { assignmentId: string }) {
  const currentAssignment = useAssignmentsStore((state) => state.currentAssignment);
  const assignments = useAssignmentsStore((state) => state.assignments);
  const isCurrentLoading = useAssignmentsStore((state) => state.isCurrentLoading);
  const error = useAssignmentsStore((state) => state.error);
  const fetchAssignment = useAssignmentsStore((state) => state.fetchAssignment);
  const upsertAssignment = useAssignmentsStore((state) => state.upsertAssignment);
  const [isRegenerating, startRegeneration] = useTransition();
  const [isPreparingPdf, startPdfPreparation] = useTransition();

  useAssignmentSubscription(assignmentId);

  const assignment =
    currentAssignment?.id === assignmentId
      ? currentAssignment
      : assignments.find((item) => item.id === assignmentId) ?? null;

  useEffect(() => {
    if (!assignment || assignment.id !== assignmentId) {
      void fetchAssignment(assignmentId);
    }
  }, [assignment, assignmentId, fetchAssignment]);

  async function handleRegenerate(): Promise<void> {
    startRegeneration(async () => {
      const next = await regenerateAssignment(assignmentId);
      upsertAssignment(next);
    });
  }

  async function handleDownload(): Promise<void> {
    if (assignment?.pdfDownloadUrl) {
      const url = absoluteApiUrl(assignment.pdfDownloadUrl);
      if (url) window.location.href = url;
      return;
    }
    startPdfPreparation(async () => {
      const next = await prepareAssignmentPdf(assignmentId);
      upsertAssignment(next);
    });
  }

  const status = assignment?.status ?? 'processing';
  const pdfStatus = assignment?.pdfStatus ?? 'idle';

  return (
    <AppShell
      activeNav="assignments"
      title="Assignment Output"
      subtitle="Review the generated question paper, then export or regenerate it."
      mobileTitle="Assignment Output"
      showBack
      backHref="/"
    >
      <div className="space-y-5">
        {/* ── Status / action banner ── */}
        <section className={`rounded-2xl p-5 ${
          status === 'failed'
            ? 'bg-[#FFF1F1] text-[#A23A3A]'
            : status === 'processing'
              ? 'bg-[#FFF4E6] text-[#B4671E]'
              : 'bg-[#1C1C1E] text-white'
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[13.5px] leading-relaxed lg:text-[14px]">
              {outputMessage(status, pdfStatus)}
            </p>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={!assignment || isPreparingPdf || status === 'processing'}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[#111] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* Download icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {assignment?.pdfDownloadUrl
                  ? 'Download as PDF'
                  : isPreparingPdf || pdfStatus === 'processing'
                    ? 'Preparing PDF...'
                    : 'Download as PDF'}
              </button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={!assignment || isRegenerating}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Error ── */}
        {error && !assignment ? (
          <div className="rounded-2xl border border-[#FFD7D7] bg-[#FFF1F1] px-5 py-4 text-[13px] text-[#A23A3A]">
            {error}
          </div>
        ) : null}

        {/* ── Loading skeleton ── */}
        {!assignment || (isCurrentLoading && !assignment.generatedPaper) ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded-full bg-[#EBEBEB]" />
              <div className="h-4 w-full animate-pulse rounded-full bg-[#F0F0F0]" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[#F0F0F0]" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F5F5F5]" />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Paper preview ── */}
        {assignment?.generatedPaper ? (
          <QuestionPaperPreview assignment={assignment} paper={assignment.generatedPaper} />
        ) : null}
      </div>
    </AppShell>
  );
}
