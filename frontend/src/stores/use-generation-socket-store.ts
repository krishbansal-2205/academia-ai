'use client';

import { create } from 'zustand';
import type { AssignmentSocketMessage } from '../lib/types';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:5000';

interface SocketState {
  socket: WebSocket | null;
  connectionState: ConnectionState;
  lastMessage: AssignmentSocketMessage | null;
  pendingAssignmentId: string | null;
  activeAssignmentId: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (assignmentId: string) => void;
}

export const useGenerationSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connectionState: 'idle',
  lastMessage: null,
  pendingAssignmentId: null,
  activeAssignmentId: null,
  connect: () => {
    const existingSocket = get().socket;
    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socket = new WebSocket(WS_URL);
    set({ socket, connectionState: 'connecting' });

    socket.onopen = () => {
      set({ connectionState: 'connected' });
      const { pendingAssignmentId } = get();
      if (pendingAssignmentId) {
        socket.send(JSON.stringify({ type: 'subscribe', assignmentId: pendingAssignmentId }));
        set({ activeAssignmentId: pendingAssignmentId });
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AssignmentSocketMessage;
        set({ lastMessage: message });
      } catch {
        set({ connectionState: 'error' });
      }
    };

    socket.onclose = () => {
      set({ connectionState: 'idle', socket: null, activeAssignmentId: null });
    };

    socket.onerror = () => {
      set({ connectionState: 'error' });
    };
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
    }
    set({
      socket: null,
      connectionState: 'idle',
      activeAssignmentId: null,
      pendingAssignmentId: null,
      lastMessage: null,
    });
  },
  subscribe: (assignmentId: string) => {
    const socket = get().socket;
    set({ pendingAssignmentId: assignmentId });

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      set({ activeAssignmentId: assignmentId });
      return;
    }

    get().connect();
  },
}));
