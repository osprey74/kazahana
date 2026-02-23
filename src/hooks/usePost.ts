import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RichText } from "@atproto/api";
import { fetch } from "@tauri-apps/plugin-http";
import { getAgent } from "../lib/agent";
import { useSettingsStore } from "../stores/settingsStore";

interface CreatePostParams {
  text: string;
  images?: { data: Uint8Array; mimeType: string; alt: string }[];
  video?: { file: File; alt: string; aspectRatio?: { width: number; height: number } };
  external?: {
    uri: string;
    title: string;
    description: string;
    thumbUrl?: string;
  };
  replyTo?: {
    uri: string;
    cid: string;
    root?: { uri: string; cid: string };
  };
  threadgate?: "everyone" | "mention" | "follower" | "following" | "nobody";
  postgate?: { disableQuote: boolean };
  onVideoProgress?: (progress: number, state: string) => void;
}

/** Error keys that map to i18n video.error.* */
export type VideoErrorKey = "notAuthenticated" | "limitReached" | "uploadFailed" | "processingFailed" | "authFailed";

export class VideoUploadError extends Error {
  constructor(public readonly i18nKey: VideoErrorKey, public readonly detail?: string) {
    super(detail || i18nKey);
    this.name = "VideoUploadError";
  }
}

const VIDEO_SERVICE = "https://video.bsky.app";

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postUri: string) => {
      const agent = getAgent();
      await agent.deletePost(postUri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["authorFeed"] });
      queryClient.invalidateQueries({ queryKey: ["actorLikes"] });
      queryClient.invalidateQueries({ queryKey: ["authorMediaFeed"] });
    },
  });
}

async function uploadVideo(
  file: File,
  onProgress?: (progress: number, state: string) => void,
): Promise<unknown> {
  const agent = getAgent();
  const did = agent.session?.did;
  if (!did) throw new VideoUploadError("notAuthenticated");

  // 1. Check upload limits via video service directly
  try {
    const limitsRes = await fetch(`${VIDEO_SERVICE}/xrpc/app.bsky.video.getUploadLimits`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${agent.session?.accessJwt}`,
      },
    });
    if (limitsRes.ok) {
      const limits = await limitsRes.json() as { canUpload: boolean; message?: string; error?: string };
      if (!limits.canUpload) {
        throw new VideoUploadError("limitReached", limits.message || limits.error);
      }
    }
  } catch (e) {
    if (e instanceof VideoUploadError) throw e;
    // Ignore network/unsupported errors for limit check
  }

  onProgress?.(0, "uploading");

  // 2. Get service auth token
  //    aud = user's PDS (the video service uploads transcoded blobs to the user's PDS)
  const pdsHostname = agent.pdsUrl?.hostname ?? new URL(agent.dispatchUrl.toString()).hostname;
  let token: string;
  try {
    const serviceAuth = await agent.com.atproto.server.getServiceAuth({
      aud: `did:web:${pdsHostname}`,
      lxm: "com.atproto.repo.uploadBlob",
      exp: Math.floor(Date.now() / 1000) + 60 * 30,
    });
    token = serviceAuth.data.token;
  } catch (e) {
    throw new VideoUploadError("authFailed", (e as Error).message);
  }

  // 3. Upload video to video.bsky.app using XMLHttpRequest for progress tracking
  const mimeType = file.type || "video/mp4";
  const uploadUrl = new URL(`${VIDEO_SERVICE}/xrpc/app.bsky.video.uploadVideo`);
  uploadUrl.searchParams.set("did", did);
  uploadUrl.searchParams.set("name", `video_${Date.now()}.${mimeToExt(mimeType)}`);

  let uploadResult: unknown;
  try {
    uploadResult = await new Promise<unknown>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl.toString());
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", mimeType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress?.(pct, "uploading");
        }
      };

      xhr.onload = () => {
        // 2xx = success, 409 = already processed (treat as success)
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 409) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new VideoUploadError("uploadFailed", "Invalid response"));
          }
        } else {
          reject(new VideoUploadError("uploadFailed", `${xhr.status} ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        reject(new VideoUploadError("uploadFailed"));
      };

      xhr.send(file);
    });
  } catch (e) {
    if (e instanceof VideoUploadError) throw e;
    throw new VideoUploadError("uploadFailed", (e as Error).message);
  }

  // Validate upload response — handle both { jobStatus: { jobId } } and { jobId } (409 already_exists)
  const res = uploadResult as Record<string, unknown>;
  const jobStatus0 = res.jobStatus as Record<string, unknown> | undefined;
  const jobId = (jobStatus0?.jobId ?? res.jobId) as string | undefined;
  if (!jobId) {
    console.error("[video] Unexpected upload response:", JSON.stringify(uploadResult));
    throw new VideoUploadError("uploadFailed", `Unexpected response: ${JSON.stringify(uploadResult).slice(0, 200)}`);
  }

  onProgress?.(100, "processing");

  // 4. Poll for processing completion via video service directly
  for (;;) {
    await new Promise((r) => setTimeout(r, 1500));

    let statusRes: Response;
    try {
      statusRes = await fetch(
        `${VIDEO_SERVICE}/xrpc/app.bsky.video.getJobStatus?jobId=${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${agent.session?.accessJwt}`,
          },
        },
      );
    } catch (e) {
      console.error("[video] Poll fetch error:", e);
      throw new VideoUploadError("processingFailed", (e as Error).message);
    }

    if (!statusRes.ok) {
      const body = await statusRes.text().catch(() => "");
      console.error("[video] Poll status not ok:", statusRes.status, body);
      throw new VideoUploadError("processingFailed", `${statusRes.status} ${body}`);
    }

    let statusData: {
      jobStatus: {
        state: string;
        progress?: number;
        blob?: unknown;
        error?: string;
        message?: string;
      };
    };
    try {
      statusData = await statusRes.json() as typeof statusData;
    } catch (e) {
      console.error("[video] Poll JSON parse error:", e);
      throw new VideoUploadError("processingFailed", "Invalid poll response");
    }

    const jobStatus = statusData.jobStatus;
    if (!jobStatus) {
      console.error("[video] Unexpected poll response:", JSON.stringify(statusData));
      throw new VideoUploadError("processingFailed", "Missing jobStatus in response");
    }

    if (jobStatus.state === "JOB_STATE_COMPLETED") {
      onProgress?.(100, "completed");
      return jobStatus.blob;
    }

    if (jobStatus.state === "JOB_STATE_FAILED") {
      throw new VideoUploadError("processingFailed", jobStatus.error || jobStatus.message);
    }

    // Keep reporting processing state (no meaningful progress number)
    onProgress?.(100, "processing");
  }
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "video/mp4": return "mp4";
    case "video/webm": return "webm";
    case "video/mpeg": return "mpeg";
    case "video/quicktime": return "mov";
    default: return "mp4";
  }
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images, video, external, replyTo, threadgate, postgate, onVideoProgress }: CreatePostParams) => {
      const agent = getAgent();

      // Build rich text with facets
      const rt = new RichText({ text });
      await rt.detectFacets(agent);

      // Upload images if any
      const imageEmbeds: { alt: string; image: unknown }[] = [];
      if (images && images.length > 0) {
        for (const img of images) {
          const res = await agent.uploadBlob(img.data, {
            encoding: img.mimeType,
          });
          imageEmbeds.push({
            alt: img.alt,
            image: res.data.blob,
          });
        }
      }

      // Upload video if any
      let videoBlob: unknown = undefined;
      if (video) {
        videoBlob = await uploadVideo(video.file, onVideoProgress);
      }

      // Build post record
      const record: Record<string, unknown> = {
        $type: "app.bsky.feed.post",
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        ...(useSettingsStore.getState().showVia ? { $via: "kazahana" } : {}),
      };

      if (imageEmbeds.length > 0) {
        record.embed = {
          $type: "app.bsky.embed.images",
          images: imageEmbeds,
        };
      } else if (videoBlob) {
        record.embed = {
          $type: "app.bsky.embed.video",
          video: videoBlob,
          alt: video!.alt || undefined,
          ...(video!.aspectRatio ? { aspectRatio: video!.aspectRatio } : {}),
        };
      } else if (external) {
        // Download and upload thumbnail if available
        let thumb: unknown = undefined;
        if (external.thumbUrl) {
          try {
            const imgRes = await fetch(external.thumbUrl, {
              method: "GET",
              connectTimeout: 8000,
            });
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const buf = new Uint8Array(await blob.arrayBuffer());
              const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
              const uploaded = await agent.uploadBlob(buf, { encoding: mimeType });
              thumb = uploaded.data.blob;
            }
          } catch {
            // Proceed without thumbnail
          }
        }
        record.embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: external.uri,
            title: external.title,
            description: external.description,
            ...(thumb ? { thumb } : {}),
          },
        };
      }

      if (replyTo) {
        record.reply = {
          root: replyTo.root ?? { uri: replyTo.uri, cid: replyTo.cid },
          parent: { uri: replyTo.uri, cid: replyTo.cid },
        };
      }

      const postResult = await agent.post(record as Parameters<typeof agent.post>[0]);

      // Extract rkey from post URI for threadgate/postgate (must match post rkey)
      const postRkey = postResult.uri.split("/").pop()!;
      const did = agent.session?.did;

      // Create threadgate if not "everyone"
      if (did && threadgate && threadgate !== "everyone") {
        const allowRules: Record<string, string>[] = [];
        if (threadgate === "mention") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#mentionRule" });
        } else if (threadgate === "follower") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#followerRule" });
        } else if (threadgate === "following") {
          allowRules.push({ $type: "app.bsky.feed.threadgate#followingRule" });
        }
        // "nobody" → empty allow array
        await agent.app.bsky.feed.threadgate.create(
          { repo: did, rkey: postRkey },
          { post: postResult.uri, allow: allowRules, createdAt: new Date().toISOString() },
        );
      }

      // Create postgate if quoting is disabled
      if (did && postgate?.disableQuote) {
        await agent.app.bsky.feed.postgate.create(
          { repo: did, rkey: postRkey },
          { post: postResult.uri, embeddingRules: [{ $type: "app.bsky.feed.postgate#disableRule" }], createdAt: new Date().toISOString() },
        );
      }

      return postResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}
