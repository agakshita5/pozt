export type Platform = "x" | "instagram" | "linkedin" | "reddit";
export type Tone = "professional" | "casual" | "punchy" | "technical";
export type SourceType = "url" | "text";

export const PLATFORMS: Platform[] = ["x", "instagram", "linkedin", "reddit"];
export const TONES: Tone[] = ["professional", "casual", "punchy", "technical"];
export const MAX_INPUT_CHARS = 15000;
export const MAX_REGENS = 3;

export const PLATFORM_LABEL: Record<Platform, string> = {
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

export interface XPayload {
  tweets: string[];
  hashtags: string[];
}
export interface InstagramPayload {
  caption: string;
  hashtags: string[];
}
export interface LinkedInPayload {
  body: string;
  hashtags: string[];
}
export interface RedditPayload {
  title: string;
  body: string;
  suggested_subreddits: string[];
}

export type PayloadFor<P extends Platform> = P extends "x"
  ? XPayload
  : P extends "instagram"
    ? InstagramPayload
    : P extends "linkedin"
      ? LinkedInPayload
      : RedditPayload;

export interface Post {
  platform: Platform;
  tone: Tone;
  payload: Record<string, unknown>;
  over_limit: string[];
  regens_remaining: number;
}

export interface RunSummary {
  id: string;
  title: string;
  source_type: SourceType;
  tone: Tone;
  created_at: string;
}

export type PostsForTone = Partial<Record<Platform, Post>>;

export interface Run extends RunSummary {
  source: string;
  extracted_text: string;
  truncated: boolean;
  /** tone -> platform -> post. Every tone this run has ever generated. */
  posts_by_tone: Partial<Record<Tone, PostsForTone>>;
}
