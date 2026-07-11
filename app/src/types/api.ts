export type ApiResponse<T> = {
  data: T;
  meta?: {
    requestId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
};

export type ApiErrorShape = {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
