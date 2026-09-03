import InstagramPreview from "./InstagramPreview";
import LinkedInPreview from "./LinkedInPreview";
import RedditPreview from "./RedditPreview";
import XPreview from "./XPreview";
import type {
  InstagramPayload,
  LinkedInPayload,
  Platform,
  RedditPayload,
  XPayload,
} from "@/lib/types";

/**
 * Routes a payload to its platform mock-up. Lives on its own so the landing
 * page can render previews without pulling in the studio's output pane.
 */
export default function Preview({
  platform,
  payload,
}: {
  platform: Platform;
  payload: Record<string, unknown>;
}) {
  switch (platform) {
    case "x":
      return <XPreview payload={payload as unknown as XPayload} />;
    case "instagram":
      return <InstagramPreview payload={payload as unknown as InstagramPayload} />;
    case "linkedin":
      return <LinkedInPreview payload={payload as unknown as LinkedInPayload} />;
    case "reddit":
      return <RedditPreview payload={payload as unknown as RedditPayload} />;
  }
}
