import { ZeeFile } from "@/types/storage";

export type DriveFile = ZeeFile;

export interface DriveRevision {
  id: string;
  modifiedTime: string;
  keepForever: boolean;
  size: string;
  originalFilename: string;
  lastModifyingUser?: { displayName: string };
}

export interface SharedDrive {
  id: string;
  name: string;
  kind: string;
  backgroundImageLink?: string;
}

export interface DriveListResponse {
  files?: DriveFile[];
  nextPageToken?: string | null;
  error?: { message: string };
}
