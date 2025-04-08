export interface ResultApiResponse {
    trackingId: string;
    timestamp: string;
    success: boolean;
    message: string;
  }
  
  export interface ApiError {
    timestamp: string;
    status: number;
    message: string;
    path?: string;
    details?: string[];
    stacktrace?: string;
  }
  
  export interface OpenpanelApiResponse<T> {
    result: ResultApiResponse;
    data?: T;
    error?: ApiError;
  }
  