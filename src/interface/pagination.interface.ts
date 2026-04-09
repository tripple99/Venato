


export interface PaginationQuery{
  page?:number,
  limit?:number,
  sortBy?:string,
  sortOrder:"asc"|"desc",
}



// export interface Pagination<T>{
//   data: T[];
//   totalCount: number;
//   currentPage: number;
//   totalPages: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
//   limit: number;
// }
export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMetaData{
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}
