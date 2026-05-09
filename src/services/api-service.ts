"use client";

const DEFAULT_API_BASE_URL = "https://dprojectsserver.azurewebsites.net";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export interface UserProfile {
  username?: string;
  avatarId?: string;
}

async function withAuthHeaders(token: string, init?: RequestInit): Promise<RequestInit> {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  };
}

export const apiService = {
  async getProfile(token: string): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}/api/profile`,
      await withAuthHeaders(token, { method: "GET" }),
    );

    if (!response.ok) {
      throw new Error(`GET /api/profile failed (${response.status})`);
    }

    return response.json();
  },

  async updateProfile(token: string, profile: UserProfile): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}/api/profile`,
      await withAuthHeaders(token, {
        method: "PUT",
        body: JSON.stringify(profile),
      }),
    );

    if (!response.ok) {
      throw new Error(`PUT /api/profile failed (${response.status})`);
    }

    return response.json();
  },
};
