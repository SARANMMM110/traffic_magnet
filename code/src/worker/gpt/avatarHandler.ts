import { Context } from "hono";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

interface MochaUser {
  id: string;
  email: string;
}

export async function handleAvatarUpload(
  c: Context<{ Bindings: Env }>,
  gptId: number,
  user: MochaUser
): Promise<Response> {
  try {
    const formData = await c.req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "File must be smaller than 5MB" }, 400);
    }

    // Generate unique storage key
    const ext = file.name.split(".").pop() || "jpg";
    const storageKey = `gpt-avatars/${user.id}/${gptId}/${Date.now()}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(storageKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL
    const avatarUrl = `https://mochausercontent.com/${storageKey}`;

    // Update database
    await c.env.DB.prepare(
      "UPDATE gpts SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
    )
      .bind(avatarUrl, gptId, user.id)
      .run();

    return c.json({ avatar_url: avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return c.json({ error: "Failed to upload avatar" }, 500);
  }
}
