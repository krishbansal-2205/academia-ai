'use client';

import { QUESTION_TYPE_OPTIONS, type QuestionType, type QuestionTypeEntry } from '../../lib/types';

interface QuestionTypeEditorProps {
  questionTypes: QuestionTypeEntry[];
  onAdd: (type: QuestionType) => void;
  onUpdate: (index: number, nextValue: Partial<QuestionTypeEntry>) => void;
  onRemove: (index: number) => void;
}

function labelForType(type: QuestionType): string {
  return QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function QuestionTypeEditor({
  questionTypes,
  onAdd,
  onUpdate,
  onRemove,
}: QuestionTypeEditorProps) {
  const availableTypes = QUESTION_TYPE_OPTIONS.filter(
    (option) => !questionTypes.some((questionType) => questionType.type === option.value)
  );

  return (
    <div className="space-y-4">
      {questionTypes.map((questionType, index) => (
        <div
          key={`${questionType.type}-${index}`}
          className="rounded-[24px] bg-white p-3 shadow-[0_10px_24px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center gap-3">
            <select
              className="min-w-0 flex-1 rounded-full bg-[#F6F6F6] px-4 py-3 text-sm font-medium text-[#303030] outline-none ring-0"
              value={questionType.type}
              onChange={(event) => {
                onUpdate(index, { type: event.target.value as QuestionType });
              }}
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-[#5E5E5E] transition hover:bg-[#F6F6F6] hover:text-[#303030]"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${labelForType(questionType.type)}`}
            >
              ×
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="rounded-[20px] bg-[#F0F0F0] p-3">
              <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#5E5E5E]">
                No. of Questions
              </span>
              <div className="flex items-center justify-between rounded-full bg-white px-3 py-2">
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#5E5E5E] transition hover:bg-[#F6F6F6]"
                  onClick={() => onUpdate(index, { count: Math.max(1, questionType.count - 1) })}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={questionType.count}
                  onChange={(event) =>
                    onUpdate(index, {
                      count: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className="w-14 bg-transparent text-center text-base font-semibold outline-none"
                />
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#5E5E5E] transition hover:bg-[#F6F6F6]"
                  onClick={() => onUpdate(index, { count: questionType.count + 1 })}
                >
                  +
                </button>
              </div>
            </label>

            <label className="rounded-[20px] bg-[#F0F0F0] p-3">
              <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#5E5E5E]">
                Marks
              </span>
              <div className="flex items-center justify-between rounded-full bg-white px-3 py-2">
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#5E5E5E] transition hover:bg-[#F6F6F6]"
                  onClick={() => onUpdate(index, { marks: Math.max(1, questionType.marks - 1) })}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={questionType.marks}
                  onChange={(event) =>
                    onUpdate(index, {
                      marks: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  className="w-14 bg-transparent text-center text-base font-semibold outline-none"
                />
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-[#5E5E5E] transition hover:bg-[#F6F6F6]"
                  onClick={() => onUpdate(index, { marks: questionType.marks + 1 })}
                >
                  +
                </button>
              </div>
            </label>
          </div>
        </div>
      ))}

      {availableTypes.length > 0 ? (
        <button
          type="button"
          className="inline-flex items-center gap-3 rounded-full px-2 py-1 text-sm font-semibold text-[#303030]"
          onClick={() => onAdd(availableTypes[0].value)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2B2B2B] text-lg text-white">
            +
          </span>
          Add Question Type
        </button>
      ) : null}
    </div>
  );
}
