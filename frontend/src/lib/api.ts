import type { ApiListResponse, ApiSuccessResponse, Assignment } from './types';

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined' && window.Clerk && window.Clerk.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch (err) {
      console.error("Failed to get Clerk token:", err);
    }
  }
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(await getAuthHeaders()),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string; error?: string }).message ??
        (errorBody as { error?: string }).error ??
        `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

/** Fire-and-forget variant — ignores the response body (for DELETE / 204). */
async function requestVoid(path: string, options: RequestInit = {}): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(await getAuthHeaders()),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string; error?: string }).message ??
        (errorBody as { error?: string }).error ??
        `Request failed with status ${response.status}`
    );
  }
}

export function absoluteApiUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE}${path}`;
}

export async function createAssignment(formData: FormData): Promise<Assignment> {
  const response = await request<ApiSuccessResponse<Assignment>>('/api/assignments', {
    method: 'POST',
    body: formData,
  });

  return response.data;
}

export async function getAssignments(): Promise<Assignment[]> {
  const response = await request<ApiListResponse<Assignment>>('/api/assignments');
  return response.data;
}

export async function getAssignment(id: string): Promise<Assignment> {
  const response = await request<ApiSuccessResponse<Assignment>>(`/api/assignments/${id}`);
  return response.data;
}

export async function regenerateAssignment(id: string): Promise<Assignment> {
  const response = await request<ApiSuccessResponse<Assignment>>(
    `/api/assignments/${id}/regenerate`,
    {
      method: 'POST',
    }
  );

  return response.data;
}

export async function prepareAssignmentPdf(id: string): Promise<Assignment> {
  const response = await request<ApiSuccessResponse<Assignment>>(`/api/assignments/${id}/pdf`, {
    method: 'POST',
  });

  return response.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await requestVoid(`/api/assignments/${id}`, { method: 'DELETE' });
}
