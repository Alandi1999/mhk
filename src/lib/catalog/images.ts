// Mirrors the `product-images` storage bucket limits (see the catalog migration).
export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const IMAGE_ACCEPT = Object.keys(IMAGE_EXTENSIONS).join(",");
