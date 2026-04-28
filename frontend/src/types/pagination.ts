export interface PaginationMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
