import { Server as HTTPServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import Assignment from '../models/Assignment';
import { WSIncomingMessage, WSOutgoingMessage, AssignmentResponse } from '../types';
import { serializeAssignment } from '../services/assignmentSerializer';
import { getCachedAssignment, getJobState } from '../services/assignmentCache';

const subscriptions = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer | null = null;

function sendMessage(ws: WebSocket, message: WSOutgoingMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function sendInitialAssignmentState(ws: WebSocket, assignmentId: string): Promise<void> {
  const cachedAssignment = await getCachedAssignment(assignmentId);

  if (cachedAssignment) {
    sendMessage(ws, {
      type: 'assignment:update',
      assignmentId,
      assignment: cachedAssignment,
      message: 'Subscribed to assignment updates',
    });
    return;
  }

  const assignment = await Assignment.findById(assignmentId);
  if (assignment) {
    sendMessage(ws, {
      type: 'assignment:update',
      assignmentId,
      assignment: serializeAssignment(assignment),
      message: 'Subscribed to assignment updates',
    });
    return;
  }

  const snapshot = await getJobState(assignmentId);
  if (snapshot) {
    console.warn(`Subscription received for missing assignment ${assignmentId}`, snapshot);
  }
}

export function initWebSocket(server: HTTPServer): WebSocketServer {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (raw: Buffer | string) => {
      try {
        const message: WSIncomingMessage = JSON.parse(raw.toString());

        if (message.type === 'subscribe' && message.assignmentId) {
          if (!subscriptions.has(message.assignmentId)) {
            subscriptions.set(message.assignmentId, new Set());
          }

          subscriptions.get(message.assignmentId)?.add(ws);
          sendMessage(ws, {
            type: 'subscribed',
            assignmentId: message.assignmentId,
          });
          await sendInitialAssignmentState(ws, message.assignmentId);
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', (error as Error).message);
      }
    });

    ws.on('close', () => {
      for (const [assignmentId, clients] of subscriptions.entries()) {
        clients.delete(ws);
        if (clients.size === 0) {
          subscriptions.delete(assignmentId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
  });

  return wss;
}

export function broadcastAssignmentUpdate(
  assignment: AssignmentResponse,
  message?: string
): void {
  const clients = subscriptions.get(assignment.id);
  if (!clients?.size) {
    return;
  }

  const payload: WSOutgoingMessage = {
    type: 'assignment:update',
    assignmentId: assignment.id,
    assignment,
    message,
  };

  for (const client of clients) {
    sendMessage(client, payload);
  }
}

export default initWebSocket;
