'use client';

import { QUESTION_TYPE_OPTIONS, type QuestionType, type QuestionTypeEntry } from '../../lib/types';

interface QuestionTypeEditorProps {
  questionTypes: QuestionTypeEntry[];
  onAdd: (type: QuestionType) => void;
  onUpdate: (index: number, nextValue: Partial<QuestionTypeEntry>) => void;
  onRemove: (index: number) => void;
}

function labelForType(type: QuestionType): string {
  return QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/* Desktop row (≥sm): select  ×  [−  4  +]  [−  4  +] */
function DesktopRow({
  questionType,
  index,
  onUpdate,
  onRemove,
}: {
  questionType: QuestionTypeEntry;
  index: number;
  onUpdate: (index: number, v: Partial<QuestionTypeEntry>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      {/* Type select */}
      <div className="relative flex-1">
        <select
          className="w-full appearance-none rounded-full border border-[#E0E0E0] bg-white px-4 py-2.5 pr-8 text-[13px] font-medium text-[#111] outline-none transition focus:border-[#111]"
          value={questionType.type}
          onChange={(e) => onUpdate(index, { type: e.target.value as QuestionType })}
        >
          {QUESTION_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#888]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {/* Remove */}
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#888] transition hover:bg-[#F5F5F5] hover:text-[#E53935]"
        onClick={() => onRemove(index)}
        aria-label={`Remove ${labelForType(questionType.type)}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Count stepper */}
      <CountStepper
        value={questionType.count}
        onDecrement={() => onUpdate(index, { count: Math.max(1, questionType.count - 1) })}
        onIncrement={() => onUpdate(index, { count: questionType.count + 1 })}
        onChange={(v) => onUpdate(index, { count: Math.max(1, v || 1) })}
      />

      {/* Marks stepper */}
      <CountStepper
        value={questionType.marks}
        onDecrement={() => onUpdate(index, { marks: Math.max(1, questionType.marks - 1) })}
        onIncrement={() => onUpdate(index, { marks: questionType.marks + 1 })}
        onChange={(v) => onUpdate(index, { marks: Math.max(1, v || 1) })}
      />
    </div>
  );
}

/* Mobile card (< sm) */
function MobileCard({
  questionType,
  index,
  onUpdate,
  onRemove,
}: {
  questionType: QuestionTypeEntry;
  index: number;
  onUpdate: (index: number, v: Partial<QuestionTypeEntry>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 sm:hidden">
      {/* Type select + remove */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <select
            className="w-full appearance-none rounded-full border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-2.5 pr-8 text-[13px] font-medium text-[#111] outline-none"
            value={questionType.type}
            onChange={(e) => onUpdate(index, { type: e.target.value as QuestionType })}
          >
            {QUESTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#888]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F8F8] text-[#888] hover:text-[#E53935]"
          onClick={() => onRemove(index)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Count + Marks */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-[#888]">No. of Questions</p>
          <CountStepper
            value={questionType.count}
            onDecrement={() => onUpdate(index, { count: Math.max(1, questionType.count - 1) })}
            onIncrement={() => onUpdate(index, { count: questionType.count + 1 })}
            onChange={(v) => onUpdate(index, { count: Math.max(1, v || 1) })}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-[#888]">Marks</p>
          <CountStepper
            value={questionType.marks}
            onDecrement={() => onUpdate(index, { marks: Math.max(1, questionType.marks - 1) })}
            onIncrement={() => onUpdate(index, { marks: questionType.marks + 1 })}
            onChange={(v) => onUpdate(index, { marks: Math.max(1, v || 1) })}
          />
        </div>
      </div>
    </div>
  );
}

/* Reusable stepper */
function CountStepper({
  value,
  onDecrement,
  onIncrement,
  onChange,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-full border border-[#E0E0E0] bg-white px-2 py-1.5 sm:w-[110px]">
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#555] transition hover:bg-[#F5F5F5]"
        onClick={onDecrement}
      >
        <span className="text-base leading-none">−</span>
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-8 bg-transparent text-center text-[13px] font-semibold text-[#111] outline-none"
      />
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#555] transition hover:bg-[#F5F5F5]"
        onClick={onIncrement}
      >
        <span className="text-base leading-none">+</span>
      </button>
    </div>
  );
}

export function QuestionTypeEditor({
  questionTypes,
  onAdd,
  onUpdate,
  onRemove,
}: QuestionTypeEditorProps) {
  const availableTypes = QUESTION_TYPE_OPTIONS.filter(
    (o) => !questionTypes.some((qt) => qt.type === o.value)
  );

  return (
    <div className="space-y-3">
      {/* Desktop column headers */}
      {questionTypes.length > 0 && (
        <div className="hidden grid-cols-[1fr_2rem_110px_110px] items-center gap-3 px-1 sm:grid">
          <span className="text-[12px] font-semibold text-[#888]">Question Type</span>
          <span />
          <span className="text-center text-[12px] font-semibold text-[#888]">No. of Questions</span>
          <span className="text-center text-[12px] font-semibold text-[#888]">Marks</span>
        </div>
      )}

      {questionTypes.map((qt, index) => (
        <div key={`${qt.type}-${index}`}>
          <DesktopRow questionType={qt} index={index} onUpdate={onUpdate} onRemove={onRemove} />
          <MobileCard questionType={qt} index={index} onUpdate={onUpdate} onRemove={onRemove} />
        </div>
      ))}

      {availableTypes.length > 0 && (
        <button
          type="button"
          className="flex items-center gap-2 py-1 text-[13px] font-semibold text-[#111]"
          onClick={() => onAdd(availableTypes[0].value)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1C1C1E] text-white">
            +
          </span>
          Add Question Type
        </button>
      )}
    </div>
  );
}
