'use client';

import { create } from 'zustand';
import type { AssignmentFormValues, QuestionType, QuestionTypeEntry } from '../lib/types';

const DEFAULT_QUESTION_TYPES: QuestionTypeEntry[] = [
  { type: 'mcq', count: 4, marks: 1 },
  { type: 'short', count: 3, marks: 2 },
  { type: 'diagram', count: 5, marks: 5 },
  { type: 'numerical', count: 5, marks: 5 },
];

function createInitialValues(): AssignmentFormValues {
  return {
    title: '',
    subject: '',
    dueDate: '',
    additionalInstructions: '',
    questionTypes: DEFAULT_QUESTION_TYPES,
    file: null,
  };
}

interface AssignmentBuilderState extends AssignmentFormValues {
  setField: <K extends keyof AssignmentFormValues>(field: K, value: AssignmentFormValues[K]) => void;
  addQuestionType: (type: QuestionType) => void;
  updateQuestionType: (index: number, nextValue: Partial<QuestionTypeEntry>) => void;
  removeQuestionType: (index: number) => void;
  reset: () => void;
}

export const useAssignmentBuilderStore = create<AssignmentBuilderState>((set) => ({
  ...createInitialValues(),
  setField: (field, value) =>
    set(() => ({
      [field]: value,
    })),
  addQuestionType: (type) =>
    set((state) => ({
      questionTypes: [...state.questionTypes, { type, count: 1, marks: 1 }],
    })),
  updateQuestionType: (index, nextValue) =>
    set((state) => {
      if (
        nextValue.type &&
        state.questionTypes.some(
          (questionType, questionTypeIndex) =>
            questionTypeIndex !== index && questionType.type === nextValue.type
        )
      ) {
        return state;
      }

      return {
        questionTypes: state.questionTypes.map((questionType, questionTypeIndex) =>
          questionTypeIndex === index
            ? {
                ...questionType,
                ...nextValue,
              }
            : questionType
        ),
      };
    }),
  removeQuestionType: (index) =>
    set((state) => ({
      questionTypes: state.questionTypes.filter((_, questionTypeIndex) => questionTypeIndex !== index),
    })),
  reset: () => set(createInitialValues()),
}));
