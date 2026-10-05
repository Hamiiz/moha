export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
}
