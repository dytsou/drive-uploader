export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "mp4":
      return "video/mp4";
    case "mkv":
      return "video/x-matroska";
    case "mp3":
      return "audio/mpeg";
    case "zip":
      return "application/zip";
    case "txt":
      return "text/plain";
    case "html":
      return "text/html";
    case "js":
      return "application/javascript";
    case "json":
      return "application/json";
    case "md":
      return "text/markdown";
    default:
      return "application/octet-stream";
  }
}
