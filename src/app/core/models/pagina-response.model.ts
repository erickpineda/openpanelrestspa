export class PaginaResponse {
  totalPages: number = 0;
  totalElements: number = 0;
  size: number = 0;
  numberOfElements: number = 0;
  empty: boolean = false;
  data: any;

  constructor() {

  }
}

export interface PaginaResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
  data: any;
}
