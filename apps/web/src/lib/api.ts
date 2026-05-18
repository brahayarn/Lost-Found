import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  AuthLoginResponse,
  AuthRefreshResponse,
  CreateItemDto,
  CreateClaimDto,
  IItem,
  IClaim,
  IUser,
  LoginDto,
} from "@lf/shared";
import { tokenStorage } from "./auth/token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = tokenStorage.get();
    if (token) {
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthRefreshResponse>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    tokenStorage.setPair(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as (InternalAxiosRequestConfig & {
      _retried?: boolean;
    }) | undefined;

    if (
      err.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/refresh") &&
      typeof window !== "undefined"
    ) {
      original._retried = true;
      refreshInFlight = refreshInFlight ?? performRefresh();
      const newAccess = await refreshInFlight;
      refreshInFlight = null;

      if (newAccess) {
        original.headers.set("Authorization", `Bearer ${newAccess}`);
        return api.request(original);
      }

      // refresh не вдався — редіректимо на логін
      const path = window.location.pathname;
      if (
        path.startsWith("/admin") &&
        !path.startsWith("/login")
      ) {
        window.location.replace(`/login?next=${encodeURIComponent(path)}`);
      }
    }
    return Promise.reject(err);
  },
);

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateItemResponse {
  id: string;
  itemNumber: string;
  trackingCode: string;
  status: string;
  title: string;
  createdAt: string;
}

export interface CreateClaimResponse {
  id: string;
  claimNumber: string;
  status: string;
}

export interface MatchProposalApi {
  _id: string;
  score: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  reasons: string[];
  createdAt: string;
  itemId: {
    _id: string;
    itemNumber: string;
    title: string;
    category: string;
    status: string;
    photoUrls?: string[];
  } | null;
  claimId: {
    _id: string;
    claimNumber: string;
    description: string;
    claimerEmail: string;
    status: string;
  } | null;
}

export interface DashboardSummary {
  totalItems: number;
  todayItems: number;
  returnedItems: number;
  openClaims: number;
  pendingMatches: number;
  conversionRate: number;
}

export interface DailyPoint {
  date: string;
  found: number;
  returned: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
}

function unwrapErr(err: unknown): Error {
  if (err instanceof AxiosError && err.response?.data) {
    const p = err.response.data as {
      message?: string;
      errors?: Array<{ path: string; message: string }>;
    };
    const detail =
      p.errors?.map((e) => `${e.path}: ${e.message}`).join("; ") ?? p.message;
    return new Error(detail || "Request failed");
  }
  return err instanceof Error ? err : new Error("Network error");
}

export async function login(dto: LoginDto): Promise<AuthLoginResponse> {
  try {
    const { data } = await api.post<AuthLoginResponse>("/auth/login", dto);
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post("/auth/logout", { refreshToken });
}

export async function fetchMe(): Promise<IUser> {
  const { data } = await api.get<IUser>("/auth/me");
  return data;
}

export async function listUsers(): Promise<IUser[]> {
  const { data } = await api.get<IUser[]>("/users");
  return data;
}

export async function createUser(payload: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<IUser> {
  try {
    const { data } = await api.post<IUser>("/users", payload);
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function updateUserRole(
  id: string,
  role: string,
): Promise<IUser> {
  try {
    const { data } = await api.patch<IUser>(`/users/${id}/role`, { role });
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await api.delete(`/users/${id}`);
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function createItem(
  dto: CreateItemDto,
): Promise<CreateItemResponse> {
  try {
    const { data } = await api.post<CreateItemResponse>("/items", dto);
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDesc?: boolean;
}

export async function listItems(
  params: ListParams = {},
): Promise<Paginated<IItem>> {
  const { data } = await api.get<Paginated<IItem>>("/items", { params });
  return data;
}

export async function listItemsAdmin(
  params: ListParams & { status?: string } = {},
): Promise<Paginated<IItem>> {
  const { data } = await api.get<Paginated<IItem>>("/items/admin", {
    params,
  });
  return data;
}

export async function verifyItem(
  id: string,
  verificationNotes?: string,
): Promise<{
  id: string;
  itemNumber: string;
  status: string;
  verifiedBy?: string;
  verifiedAt?: string;
}> {
  try {
    const { data } = await api.post<{
      id: string;
      itemNumber: string;
      status: string;
      verifiedBy?: string;
      verifiedAt?: string;
    }>(`/items/${id}/verify`, { verificationNotes });
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function confirmClaimIdentity(
  id: string,
  idDocumentUrl?: string,
): Promise<{ id: string; claimNumber: string; identityConfirmed: boolean }> {
  try {
    const { data } = await api.post(`/claims/${id}/confirm-identity`, {
      idDocumentUrl,
    });
    return data as {
      id: string;
      claimNumber: string;
      identityConfirmed: boolean;
    };
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function revokeClaimIdentity(
  id: string,
): Promise<{ id: string; claimNumber: string; identityConfirmed: boolean }> {
  try {
    const { data } = await api.post(`/claims/${id}/revoke-identity`);
    return data as {
      id: string;
      claimNumber: string;
      identityConfirmed: boolean;
    };
  } catch (err) {
    throw unwrapErr(err);
  }
}

export interface RetentionPolicyApi {
  category: string;
  days: number;
}

export async function listRetentionPolicies(): Promise<RetentionPolicyApi[]> {
  const { data } = await api.get<RetentionPolicyApi[]>("/retention-policies");
  return data;
}

export async function updateRetentionPolicy(
  category: string,
  days: number,
): Promise<RetentionPolicyApi> {
  try {
    const { data } = await api.put<RetentionPolicyApi>(
      `/retention-policies/${category}`,
      { days },
    );
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export interface HandoverActApi {
  _id: string;
  itemId:
    | {
        _id: string;
        itemNumber: string;
        title: string;
        category: string;
        foundLocation?: { address: string };
        foundAt?: string;
      }
    | string;
  claimId?:
    | {
        _id: string;
        claimNumber: string;
        claimerEmail: string;
        description?: string;
      }
    | string
    | null;
  operatorName: string;
  signature: string;
  notes?: string;
  handoverDate: string;
  createdAt: string;
}

export async function listHandoverActs(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    from?: string;
    to?: string;
  } = {},
): Promise<Paginated<HandoverActApi>> {
  const { data } = await api.get<Paginated<HandoverActApi>>(
    "/handover-acts",
    { params },
  );
  return data;
}

export async function fetchHandoverAct(id: string): Promise<HandoverActApi> {
  const { data } = await api.get<HandoverActApi>(`/handover-acts/${id}`);
  return data;
}

export interface SubscriptionApi {
  _id: string;
  email: string;
  category: string;
  keywords: string[];
  active: boolean;
  createdAt: string;
  lastNotifiedAt?: string;
}

export async function createSubscription(payload: {
  email: string;
  category: string;
  keywords?: string[];
}): Promise<{ id: string; email: string; category: string; keywords: string[] }> {
  try {
    const { data } = await api.post("/subscriptions", payload);
    return data as {
      id: string;
      email: string;
      category: string;
      keywords: string[];
    };
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function listSubscriptions(
  params: { page?: number; pageSize?: number; search?: string } = {},
): Promise<Paginated<SubscriptionApi>> {
  const { data } = await api.get<Paginated<SubscriptionApi>>(
    "/subscriptions",
    { params },
  );
  return data;
}

export async function deactivateSubscription(id: string): Promise<void> {
  try {
    await api.delete(`/subscriptions/${id}`);
  } catch (err) {
    throw unwrapErr(err);
  }
}

export interface NotificationTemplateApi {
  _id: string;
  key: string;
  description: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  updatedAt: string;
}

export async function listNotificationTemplates(): Promise<
  NotificationTemplateApi[]
> {
  const { data } = await api.get<NotificationTemplateApi[]>(
    "/notification-templates",
  );
  return data;
}

export async function updateNotificationTemplate(
  key: string,
  payload: { subject?: string; html?: string; text?: string },
): Promise<NotificationTemplateApi> {
  try {
    const { data } = await api.put<NotificationTemplateApi>(
      `/notification-templates/${key}`,
      payload,
    );
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export interface AuditLogApi {
  _id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  method: string;
  path: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  error?: string;
  createdAt: string;
}

export async function listAuditLogs(
  params: {
    page?: number;
    pageSize?: number;
    actorId?: string;
    action?: string;
  } = {},
): Promise<Paginated<AuditLogApi>> {
  const { data } = await api.get<Paginated<AuditLogApi>>("/audit-logs", {
    params,
  });
  return data;
}

export async function disposeItems(
  ids: string[],
  action: "POLICE" | "CHARITY" | "DESTROY",
): Promise<{ modified: number; action: string }> {
  try {
    const { data } = await api.post<{ modified: number; action: string }>(
      "/items/dispose",
      { ids, action },
    );
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function exportItemsCsv(
  params: { status?: string; search?: string } = {},
): Promise<Blob> {
  const { data } = await api.get("/items/export.csv", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}

export async function exportItemsXlsx(
  params: { status?: string; search?: string } = {},
): Promise<Blob> {
  const { data } = await api.get("/items/export.xlsx", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}

export async function createClaim(
  dto: CreateClaimDto,
): Promise<CreateClaimResponse> {
  try {
    const { data } = await api.post<CreateClaimResponse>("/claims", dto);
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function fetchClaim(id: string): Promise<IClaim> {
  const { data } = await api.get<IClaim>(`/claims/${id}`);
  return data;
}

export async function updateClaimStatus(
  id: string,
  status: string,
): Promise<{ id: string; claimNumber: string; status: string }> {
  try {
    const { data } = await api.patch<{
      id: string;
      claimNumber: string;
      status: string;
    }>(`/claims/${id}/status`, { status });
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function listClaims(
  params: ListParams = {},
): Promise<Paginated<IClaim>> {
  const { data } = await api.get<Paginated<IClaim>>("/claims", { params });
  return data;
}

export async function fetchMatch(id: string): Promise<MatchProposalApi> {
  const { data } = await api.get<MatchProposalApi>(`/matches/${id}`);
  return data;
}

export async function listMatches(
  params: { page?: number; pageSize?: number; status?: string } = {},
): Promise<Paginated<MatchProposalApi>> {
  const { data } = await api.get<Paginated<MatchProposalApi>>("/matches", {
    params,
  });
  return data;
}

export async function confirmMatch(id: string) {
  const { data } = await api.post<{ id: string; status: string }>(
    `/matches/${id}/confirm`,
  );
  return data;
}

export async function rejectMatch(id: string) {
  const { data } = await api.post<{ id: string; status: string }>(
    `/matches/${id}/reject`,
  );
  return data;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/analytics/summary");
  return data;
}

export async function fetchDailyAnalytics(): Promise<DailyPoint[]> {
  const { data } = await api.get<DailyPoint[]>("/analytics/daily");
  return data;
}

export function itemLabelUrl(id: string): string {
  return `${API_URL}/items/${id}/label`;
}

export async function fetchItem(id: string): Promise<IItem> {
  const { data } = await api.get<IItem>(`/items/${id}`);
  return data;
}

export async function fetchItemFull(id: string): Promise<IItem> {
  const { data } = await api.get<IItem>(`/items/${id}/full`);
  return data;
}

export interface HandoverResponse {
  id: string;
  itemId: string;
  itemNumber: string;
  claimId?: string;
  handoverDate: string;
}

export async function postHandover(
  itemId: string,
  body: { signature: string; claimId?: string; notes?: string },
): Promise<HandoverResponse> {
  try {
    const { data } = await api.post<HandoverResponse>(
      `/items/${itemId}/handover`,
      body,
    );
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}

export async function fetchCategoryAnalytics(): Promise<CategoryPoint[]> {
  const { data } = await api.get<CategoryPoint[]>("/analytics/categories");
  return data;
}

export async function fetchLocationAnalytics(): Promise<CategoryPoint[]> {
  const { data } = await api.get<CategoryPoint[]>("/analytics/locations");
  return data;
}

export interface UploadedPhotos {
  urls: string[];
  blurredUrls: string[];
}

export async function uploadPhotos(files: File[]): Promise<UploadedPhotos> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  try {
    const { data } = await api.post<UploadedPhotos>("/uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
    return data;
  } catch (err) {
    throw unwrapErr(err);
  }
}
