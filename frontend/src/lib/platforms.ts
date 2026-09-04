import type { Platform } from "./types";

export interface PlatformMeta {
  label: string;
  // the platform's own accent, used inside its mock-up only
  brand: string;
  // what the character counter measures, for showcase captions
  limit: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  x: { label: "X", brand: "#1D9BF0", limit: "280 characters per post" },
  instagram: { label: "Instagram", brand: "#E1306C", limit: "2,200 character caption" },
  linkedin: { label: "LinkedIn", brand: "#0A66C2", limit: "3,000 characters" },
  reddit: { label: "Reddit", brand: "#FF4500", limit: "300 character title" },
};
