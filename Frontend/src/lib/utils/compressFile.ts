const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;

function isImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)(\?|$)/i.test(file.name);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressImage(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let { width, height } = img;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', IMAGE_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Compress file before upload:
 * - Images → Canvas WebP (resize + compress, high quality)
 * - Documents/Books/Video → pass through as-is
 */
export async function compressFile(file: File): Promise<File> {
  if (isImage(file)) return compressImage(file);
  return file;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
