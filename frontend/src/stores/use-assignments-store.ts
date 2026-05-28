'use client';

import { create } from 'zustand';
import { deleteAssignment as apiDeleteAssignment, getAssignment, getAssignments } from '../lib/api';
import type { Assignment } from '../lib/types';

interface AssignmentsState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isListLoading: boolean;
  isCurrentLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  upsertAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => Promise<void>;
  clearError: () => void;
  clearAssignments: () => void;
}

function mergeAssignmentList(assignments: Assignment[], nextAssignment: Assignment): Assignment[] {
  const existingIndex = assignments.findIndex((assignment) => assignment.id === nextAssignment.id);

  if (existingIndex === -1) {
    return [nextAssignment, ...assignments].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  const updated = [...assignments];
  updated[existingIndex] = nextAssignment;
  return updated;
}

export const useAssignmentsStore = create<AssignmentsState>((set) => ({
  assignments: [],
  currentAssignment: null,
  isListLoading: false,
  isCurrentLoading: false,
  error: null,
  fetchAssignments: async () => {
    set({ isListLoading: true, error: null });
    try {
      const assignments = await getAssignments();
      set({ assignments, isListLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load assignments',
        isListLoading: false,
      });
    }
  },
  fetchAssignment: async (id: string) => {
    set({ isCurrentLoading: true, error: null });
    try {
      const assignment = await getAssignment(id);
      set((state) => ({
        currentAssignment: assignment,
        assignments: mergeAssignmentList(state.assignments, assignment),
        isCurrentLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load assignment',
        isCurrentLoading: false,
      });
    }
  },
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  upsertAssignment: (assignment) =>
    set((state) => ({
      currentAssignment:
        state.currentAssignment?.id === assignment.id ? assignment : state.currentAssignment,
      assignments: mergeAssignmentList(state.assignments, assignment),
    })),
  deleteAssignment: async (id: string) => {
    try {
      await apiDeleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== id),
        currentAssignment: state.currentAssignment?.id === id ? null : state.currentAssignment,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete assignment' });
    }
  },
  clearError: () => set({ error: null }),
  clearAssignments: () => set({ assignments: [], currentAssignment: null, error: null }),
}));
