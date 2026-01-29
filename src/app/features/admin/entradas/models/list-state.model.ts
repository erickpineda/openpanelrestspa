import { AdvancedSearchParams, DataOption } from '@app/shared/models/search.models';
import { EntradaVM } from './entrada.vm';
import { SearchParams } from './search-params.model';

export interface ListState {
  entradas: EntradaVM[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: any | null;
  allEntradasClientCache: EntradaVM[];
  isServerPaging: boolean;
  lastSearchParams: SearchParams | null;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
  lastAdvancedCriteriaList?: AdvancedSearchParams['searchCriteriaList'] | null;
  lastAdvancedDataOption?: DataOption | null;
}
