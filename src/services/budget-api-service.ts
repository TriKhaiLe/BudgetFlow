"use client";

import type { BudgetLogSnapshot, BudgetState } from "@/lib/types";
import { API_BASE_URL } from "@/services/api-service";

export interface BudgetMonthSummary {
  month: string;
  label: string;
  updatedAt: string;
}

export interface BudgetStateResponse {
  month: string;
  version: number;
  updatedAt: string;
  state: BudgetState;
}

export interface BudgetStateUpdateRequest {
  version: number;
  state: BudgetState;
}

export interface BudgetSnapshotResponse {
  month: string;
  snapshot: BudgetLogSnapshot;
}

export interface BudgetSnapshotRequest {
  month: string;
  snapshot: BudgetLogSnapshot;
}

export class BudgetApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function withAuthHeaders(
  token: string,
  init?: RequestInit,
): Promise<RequestInit> {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  };
}

async function requestJson<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    await withAuthHeaders(token, init),
  );

  if (response.ok) {
    return response.json();
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    (payload as any)?.error?.message ||
    `Request failed with status ${response.status}`;

  throw new BudgetApiError(message, response.status, payload);
}

export const budgetApiService = {
  getMonths(token: string): Promise<{ months: BudgetMonthSummary[] }> {
    return requestJson(token, "/api/budget/months", { method: "GET" });
  },

  getState(token: string, month: string): Promise<BudgetStateResponse> {
    return requestJson(token, `/api/budget/state?month=${month}`, {
      method: "GET",
    });
  },

  upsertState(
    token: string,
    month: string,
    payload: BudgetStateUpdateRequest,
  ): Promise<BudgetStateResponse> {
    return requestJson(token, `/api/budget/state?month=${month}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  startNextMonth(
    token: string,
    fromMonth: string,
  ): Promise<{ createdMonth: string; version: number; state: BudgetState }> {
    return requestJson(token, "/api/budget/start-next-month", {
      method: "POST",
      body: JSON.stringify({ fromMonth }),
    });
  },

  upsertSnapshot(
    token: string,
    payload: BudgetSnapshotRequest,
  ): Promise<BudgetSnapshotResponse> {
    return requestJson(token, "/api/budget/snapshot", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getSnapshot(token: string, month: string): Promise<BudgetSnapshotResponse> {
    return requestJson(token, `/api/budget/snapshot?month=${month}`, {
      method: "GET",
    });
  },
};
