// Phone cameras produce 3–8 MB photos, which is painfully slow to upload over
// a mobile connection on site. Photo evidence only needs to be legible, so
// scale to at most `maxSize` px on the long edge and re-encode as JPEG.
// Falls back to the original file if the browser can't decode it.
export async function compressImage(file: Blob, maxSize = 1600, quality = 0.8): Promise<Blob> {
  try {
    // "from-image" applies the EXIF rotation so portrait shots aren't sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    // Never make it bigger than what we started with.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
