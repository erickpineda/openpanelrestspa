export interface TemaVersion {
  idTemaVersion?: number;
  version: number;
  state: 'DRAFT' | 'PUBLISHED' | string;
  sourceType?: string;
  checksum?: string;
  publishedAt?: string | Date;
  publishedBy?: string;
  releaseNotes?: string;
}

