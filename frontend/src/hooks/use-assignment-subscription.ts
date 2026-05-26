'use client';

import { useEffect, useEffectEvent } from 'react';
import { useAssignmentsStore } from '../stores/use-assignments-store';
import { useGenerationSocketStore } from '../stores/use-generation-socket-store';
import type { AssignmentSocketMessage } from '../lib/types';

export function useAssignmentSubscription(assignmentId: string | null): void {
  const connect = useGenerationSocketStore((state) => state.connect);
  const subscribe = useGenerationSocketStore((state) => state.subscribe);
  const lastMessage = useGenerationSocketStore((state) => state.lastMessage);

  const applyMessage = useEffectEvent((message: AssignmentSocketMessage | null) => {
    if (!message || message.type !== 'assignment:update' || !message.assignment) {
      return;
    }

    useAssignmentsStore.getState().upsertAssignment(message.assignment);
  });

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    connect();
    subscribe(assignmentId);
  }, [assignmentId, connect, subscribe]);

  useEffect(() => {
    applyMessage(lastMessage);
  }, [lastMessage]);
}
