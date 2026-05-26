'use client';

import { useEffect, useTransition } from 'react';
import { absoluteApiUrl, prepareAssignmentPdf, regenerateAssignment } from '../../lib/api';
import { useAssignmentSubscription } from '../../hooks/use-assignment-subscription';
import { useAssignmentsStore } from '../../stores/use-assignments-store';
import { QuestionPaperPreview } from '../assignments/question-paper-preview';
import { AppShell } from '../shell/app-shell';

function outputMessage(status: string, pdfStatus: string): string {
  if (status === 'processing') {
    return 'Your question paper is being generated from the uploaded material.';
  }

  if (status === 'failed') {
    return 'Generation did not complete successfully. You can retry with the same assignment settings.';
  }

  if (pdfStatus === 'processing') {
    return 'Question paper is ready. The downloadable PDF is being prepared in the background.';
  }

  if (pdfStatus === 'failed') {
    return 'Question paper is ready, but the PDF export needs another attempt.';
  }

  return 'Your structured question paper is ready to review, download, or regenerate.';
}

function statusPanelTone(status: string): string {
  if (status === 'failed') {
    return 'bg-[#FFF1F1] text-[#A23A3A]';
  }

  if (status === 'processing') {
    return 'bg-[#FFF4E6] text-[#B4671E]';
  }

  return 'bg-[rgba(24,24,24,0.82)] text-white';
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
      const nextAssignment = await regenerateAssignment(assignmentId);
      upsertAssignment(nextAssignment);
    });
  }

  async function handleDownload(): Promise<void> {
    if (assignment?.pdfDownloadUrl) {
      const downloadUrl = absoluteApiUrl(assignment.pdfDownloadUrl);
      if (downloadUrl) {
        window.location.href = downloadUrl;
      }
      return;
    }

    startPdfPreparation(async () => {
      const nextAssignment = await prepareAssignmentPdf(assignmentId);
      upsertAssignment(nextAssignment);
    });
  }

  return (
    <AppShell
      activeNav="assignments"
      title="Assignment Output"
      subtitle="Review the generated question paper, then export or regenerate it."
      mobileTitle="Assignment Output"
      showBack
      backHref="/"
    >
      <div className="space-y-6">
        <section className={`rounded-[32px] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.14)] xl:p-8 ${statusPanelTone(assignment?.status ?? 'processing')}`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-bold tracking-[-0.04em] xl:text-2xl">
                {assignment?.title ?? 'Preparing assignment'}
              </h2>
              <p className="max-w-3xl text-sm leading-7 opacity-90 xl:text-base">
                {outputMessage(assignment?.status ?? 'processing', assignment?.pdfStatus ?? 'idle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={!assignment || isPreparingPdf || assignment.status === 'processing'}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#303030] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assignment?.pdfDownloadUrl
                  ? 'Download as PDF'
                  : isPreparingPdf || assignment?.pdfStatus === 'processing'
                    ? 'Preparing PDF...'
                    : 'Generate PDF'}
              </button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={!assignment || isRegenerating}
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-current transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </section>

        {error && !assignment ? (
          <div className="rounded-[28px] border border-[#FFD7D7] bg-[#FFF1F1] px-5 py-4 text-sm text-[#A23A3A]">
            {error}
          </div>
        ) : null}

        {!assignment || (isCurrentLoading && !assignment.generatedPaper) ? (
          <div className="rounded-[32px] bg-white/70 p-8 shadow-[0_18px_44px_rgba(0,0,0,0.08)]">
            <div className="space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded-full bg-[#E8E8E8]" />
              <div className="h-5 w-full animate-pulse rounded-full bg-[#EFEFEF]" />
              <div className="h-5 w-5/6 animate-pulse rounded-full bg-[#EFEFEF]" />
              <div className="mt-8 grid gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-[24px] bg-[#F7F7F7]" />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {assignment?.generatedPaper ? (
          <QuestionPaperPreview assignment={assignment} paper={assignment.generatedPaper} />
        ) : null}
      </div>
    </AppShell>
  );
}
