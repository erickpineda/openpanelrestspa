export interface MeResponse {
  id: number;
  username: string;
  nombre?: string;
  apellido?: string;
  roles?: string[];
  privileges: string[];
}

