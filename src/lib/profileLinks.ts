import { ModerationDecision } from "@atproto/api";
import type { AppBskyActorDefs, ComAtprotoLabelDefs, ModerationOpts } from "@atproto/api";

/**
 * Profile links (`app.bsky.actor.link`), display only.
 *
 * The AppView returns them on `profileViewDetailed.links` as `profileLinkView`s,
 * in display order. Links are edited in the official client; kazahana only
 * shows them.
 *
 * NOTE: as of @atproto/api 0.20.16 `links` is served at runtime but NOT present
 * in the type definitions. This accessor reads it via a local cast so the
 * untyped access stays contained here; revisit on the next @atproto/api upgrade.
 *
 * The filtering rules mirror social-app `src/features/profileLinks/record.ts`
 * (MIT, Copyright Bluesky Social PBC): the AppView applies the same rules, but
 * any client can write link records, so the client checks again.
 */
interface ProfileLinkView {
  uri: string;
  cid: string;
  url: string;
  title?: string;
  icon?: string;
  labels?: ComAtprotoLabelDefs.Label[];
}

export interface ProfileLink {
  uri: string;
  url: string;
  /** Title, or the destination's host when the link has none. */
  label: string;
  iconUrl?: string;
}

const MAX_PROFILE_LINKS = 10;
const MAX_TITLE_LENGTH = 30;

/**
 * General-purpose URL shorteners, which hide where a link goes.
 * Copied from social-app `src/features/profileLinks/providers.ts`.
 */
const SHORTENER_DOMAINS = [
  "aceimg.in", "acel.me", "adf.ly", "bit.ly", "bitly.com", "bl.ink", "buff.ly",
  "clck.ru", "cutt.ly", "fc-lc.xyz", "goo.gl", "goto.now", "is.gd", "link2.fm",
  "ln.run", "lnk.ua", "lnkd.in", "n9.cl", "onlylinks.cc", "ow.ly", "psee.io",
  "rb.gy", "rebrand.ly", "rg.by", "s.id", "short.do", "short.gy", "shorten.as",
  "shorten.ee", "shorten.is", "shorten.so", "shorten.tv", "shorten.world",
  "shorter.me", "shortn.icu", "shorturl.at", "shorturl.lt", "shorturl.ly",
  "slicedrve.in", "slnt.to", "smarturl.lt", "smarturl.my", "sprl.me", "sw.run",
  "t.co", "t.ly", "tiny.cc", "tinyurl.com", "urlr.me", "v.gd", "vdey.in",
  "videy.at", "videy.lt", "videy.my", "x.gd", "zig.ht",
];

function isShortenerHost(host: string): boolean {
  return SHORTENER_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Cuts by grapheme, so an emoji is never split in half. */
function truncateTitle(title: string): string {
  const graphemes = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(title),
    (s) => s.segment,
  );
  if (graphemes.length <= MAX_TITLE_LENGTH) return title;
  return graphemes.slice(0, MAX_TITLE_LENGTH).join("").trim();
}

/**
 * A link button can't show a warning, so a label that would blur the link
 * hides it instead (same as social-app `moderateProfileLink`).
 */
function isHiddenByLabels(view: ProfileLinkView, ownerDid: string, opts: ModerationOpts): boolean {
  if (!view.labels?.length) return false;
  const decision = new ModerationDecision();
  decision.setDid(ownerDid);
  decision.setIsMe(ownerDid === opts.userDid);
  for (const label of view.labels) {
    decision.addLabel("content", label, opts);
  }
  const ui = decision.ui("contentList");
  return ui.filter || ui.blur;
}

export function getProfileLinks(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  moderationOpts: ModerationOpts | undefined,
): ProfileLink[] {
  const { links: views } = profile as { links?: ProfileLinkView[] };
  if (!Array.isArray(views)) return [];

  const links: ProfileLink[] = [];
  const seen = new Set<string>();
  for (const view of views) {
    if (links.length >= MAX_PROFILE_LINKS) break;
    let parsed: URL;
    try {
      parsed = new URL(view.url);
    } catch {
      continue;
    }
    // Only https: plain http can be tampered with on the way.
    if (parsed.protocol !== "https:") continue;
    const host = parsed.hostname.toLowerCase();
    if (isShortenerHost(host) || seen.has(parsed.href)) continue;
    if (moderationOpts && isHiddenByLabels(view, profile.did, moderationOpts)) continue;
    seen.add(parsed.href);

    const title = view.title ? truncateTitle(view.title.trim()) : "";
    links.push({
      uri: view.uri,
      url: parsed.href,
      label: title || host.replace(/^www\./, ""),
      iconUrl: view.icon,
    });
  }
  return links;
}
