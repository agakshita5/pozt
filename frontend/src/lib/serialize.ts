import type {InstagramPayload, LinkedInPayload, Platform, RedditPayload, XPayload} from "./types";

const tags = (hashtags: string[] = []) =>
  hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");

export function toPlainText(platform: Platform, payload: Record<string, unknown>): string {
  switch (platform) {
    case "x": {
      const { tweets = [], hashtags = [] } = payload as unknown as XPayload;
      const parts = [...tweets];
      if (parts.length && tags(hashtags)) {
        parts[parts.length - 1] += `\n\n${tags(hashtags)}`;
      }
      return parts.join("\n\n");
    }
    case "instagram": {
      const { caption = "", hashtags = [] } =
        payload as unknown as InstagramPayload;
      return [caption, tags(hashtags)].filter(Boolean).join("\n\n");
    }
    case "linkedin": {
      const { body = "", hashtags = [] } = payload as unknown as LinkedInPayload;
      return [body, tags(hashtags)].filter(Boolean).join("\n\n");
    }
    case "reddit": {
      const { title = "", body = "" } = payload as unknown as RedditPayload;
      return [title, body].filter(Boolean).join("\n\n");
    }
  }
}
