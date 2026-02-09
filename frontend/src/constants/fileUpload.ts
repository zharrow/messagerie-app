/**
 * File upload constants
 * Shared across components that handle file uploads
 */

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  ALLOWED_ARCHIVE_TYPES: ['application/zip', 'application/x-rar-compressed'],
} as const;

/**
 * Check if a file exceeds the max size
 */
export function isFileTooLarge(file: File): boolean {
  return file.size > FILE_UPLOAD.MAX_SIZE_BYTES;
}

/**
 * Check if file type is an image
 */
export function isImageFile(file: File | { mimeType: string }): boolean {
  const mimeType = 'type' in file ? file.type : file.mimeType;
  return mimeType.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
