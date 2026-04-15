export interface TemaVersionCompare {
  from: number;
  to: number;
  added: Record<string, any>;
  removed: Record<string, any>;
  changed: Record<string, { from: any; to: any }>;
}

