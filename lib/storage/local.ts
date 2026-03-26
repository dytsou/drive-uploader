import fs from "fs/promises";
import path from "path";
import { getMimeType } from "./mime";
import { ZeeFile, ListFilesResponse } from "@/types/storage";

const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || "storage";
export const LOCAL_ROOT = path.isAbsolute(LOCAL_STORAGE_PATH)
  ? LOCAL_STORAGE_PATH
  : path.resolve(process.cwd(), LOCAL_STORAGE_PATH);

export async function ensureLocalRoot() {
  try {
    await fs.access(LOCAL_ROOT);
  } catch {
    console.log(`[Storage] Creating local storage root: ${LOCAL_ROOT}`);
    await fs.mkdir(LOCAL_ROOT, { recursive: true });
  }
}

export async function listLocalFiles(
  folderPath: string,
): Promise<ListFilesResponse> {
  await ensureLocalRoot();
  const absolutePath = path.resolve(
    LOCAL_ROOT,
    folderPath.startsWith("/") ? folderPath.substring(1) : folderPath,
  );

  if (!absolutePath.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error("Akses dilarang (Path traversal)");
  }

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });

  const files: ZeeFile[] = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(absolutePath, entry.name);
      const stats = await fs.stat(filePath);
      const relativePath = path
        .relative(LOCAL_ROOT, filePath)
        .replace(/\\/g, "/");
      const isFolder = entry.isDirectory();

      return {
        id: `local://${relativePath}`,
        name: entry.name,
        mimeType: isFolder
          ? "application/vnd.google-apps.folder"
          : getMimeType(entry.name) || "application/octet-stream",
        size: String(stats.size),
        modifiedTime: stats.mtime.toISOString(),
        createdTime: stats.birthtime.toISOString(),
        isFolder,
        source: "local" as const,
        hasThumbnail: false,
        path: relativePath,
      };
    }),
  );

  return {
    files,
    nextPageToken: null,
  };
}

export async function getLocalFileDetails(
  filePath: string,
): Promise<ZeeFile | null> {
  await ensureLocalRoot();
  const absolutePath = path.resolve(
    LOCAL_ROOT,
    filePath.startsWith("/") ? filePath.substring(1) : filePath,
  );

  if (!absolutePath.startsWith(path.resolve(LOCAL_ROOT))) {
    return null;
  }

  try {
    const stats = await fs.stat(absolutePath);
    const isFolder = stats.isDirectory();
    const relativePath = path
      .relative(LOCAL_ROOT, absolutePath)
      .replace(/\\/g, "/");

    return {
      id: `local://${relativePath}`,
      name: path.basename(absolutePath),
      mimeType: isFolder
        ? "application/vnd.google-apps.folder"
        : getMimeType(absolutePath) || "application/octet-stream",
      size: String(stats.size),
      modifiedTime: stats.mtime.toISOString(),
      createdTime: stats.birthtime.toISOString(),
      isFolder,
      source: "local" as const,
      hasThumbnail: false,
      path: relativePath,
    };
  } catch {
    return null;
  }
}

export async function getLocalFilePath(filePath: string): Promise<string> {
  await ensureLocalRoot();
  const absolutePath = path.resolve(
    LOCAL_ROOT,
    filePath.startsWith("/") || filePath.includes(":\\") ? filePath : filePath,
  );

  const root = path.resolve(LOCAL_ROOT);
  if (!absolutePath.startsWith(root)) {
    throw new Error("Akses dilarang (Path traversal)");
  }
  return absolutePath;
}
