export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content?: string;
  ts?: number;
  meta?: {
    error?: boolean;
    pending?: boolean;
  };
}

export interface RecommendationItem {
  id: string | number;
  title: string;
  image?: string;
  location?: string;
  price?: string | number;
  currency?: string;
}