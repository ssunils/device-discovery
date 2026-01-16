import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import fetch from "node-fetch";

class ImageManager {
  private imageDir = "data/images";

  constructor() {
    this.ensureDir();
  }

  private async ensureDir() {
    try {
      if (!existsSync(this.imageDir)) {
        await mkdir(this.imageDir, { recursive: true });
      }
    } catch (e) {
      console.error("[IMAGE] Failed to ensure image directory:", e);
    }
  }

  /**
   * Download image from URL and save it locally
   * Returns the local path if successful, null otherwise
   */
  public async downloadAndSaveImage(
    imageUrl: string | null,
    jid: string
  ): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      // Sanitize JID to use as filename (remove special characters)
      const sanitizedJid = jid.replace(/[@.]/g, "_");

      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.log(
          `[IMAGE] Failed to download image for ${jid}: ${response.statusText}`
        );
        return null;
      }

      // Get buffer from response
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine file extension from content-type or default to jpg
      const contentType = response.headers.get("content-type") || "image/jpeg";
      let extension = "jpg";
      if (contentType.includes("png")) extension = "png";
      else if (contentType.includes("gif")) extension = "gif";
      else if (contentType.includes("webp")) extension = "webp";

      const filename = `${sanitizedJid}.${extension}`;
      const filepath = path.join(this.imageDir, filename);

      console.log(`[IMAGE] Saving image for ${jid} to ${filepath}`);

      // Save to local file
      await writeFile(filepath, buffer);

      console.log(`[IMAGE] Successfully saved image: ${filename}`);

      // Return the local path
      return `/images/${filename}`;
    } catch (err) {
      console.error(`[IMAGE] Failed to download/save image for ${jid}:`, err);
      return null;
    }
  }

  /**
   * Get the local image path for a contact
   */
  public getImagePath(jid: string): string | null {
    const sanitizedJid = jid.replace(/[@.]/g, "_");

    // Check for any image file with this name (jpg, png, gif, webp)
    const extensions = ["jpg", "jpeg", "png", "gif", "webp"];
    for (const ext of extensions) {
      const filename = `${sanitizedJid}.${ext}`;
      const filepath = path.join(this.imageDir, filename);
      if (existsSync(filepath)) {
        return `/images/${filename}`;
      }
    }
    return null;
  }
}

export const imageManager = new ImageManager();
