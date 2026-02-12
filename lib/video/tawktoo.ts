import { env } from "@/lib/env";

const TAWKTOO_API_URL = env.TAWKTOO_API_URL;
const TAWKTOO_API_KEY = env.TAWKTOO_API_KEY;

interface CreateMeetingParams {
  topic: string;
  startTime?: string; // ISO string
  duration?: number; // minutes
  hostEmail?: string;
}

interface MeetingResponse {
  meeting: string; // The URL returned by the API
}

class TawkTooService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TAWKTOO_API_KEY;
    this.baseUrl = TAWKTOO_API_URL;
  }

  private async request<T>(endpoint: string, method: string = "GET", body?: any): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TawkToo API Error [${response.status}]:`, errorText);
        throw new Error(`TawkToo API Request Failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("TawkToo Service Error:", error);
      throw error;
    }
  }

  /**
   * Creates a new meeting room
   */
  async createMeeting(params: CreateMeetingParams): Promise<MeetingResponse> {
    return this.request<MeetingResponse>("/meeting", "POST", params);
  }

  /**
   * Gets meeting details (Placeholder if needed)
   */
  async getMeeting(meetingId: string): Promise<MeetingResponse> {
    return this.request<MeetingResponse>(`/meeting/${meetingId}`, "GET");
  }
}

export const tawkTooClient = new TawkTooService();
