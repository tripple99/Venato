import {z} from "zod";
import { PaginationMetaData,PaginationQuery,PaginationOptions, PaginationResult } from "../interface/pagination.interface";


export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
} as const;





const paginationValidate = z.object({
  page: z.string()
    .transform(val => parseInt(val))
    .optional()
    .default(PAGINATION_DEFAULTS.PAGE),  // number
  limit: z.string()
    .transform(val => Math.min(parseInt(val), PAGINATION_DEFAULTS.MAX_LIMIT))
    .optional()
    .default(PAGINATION_DEFAULTS.LIMIT),  // number
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default(PAGINATION_DEFAULTS.SORT_ORDER),
})


export function paginationQuery(query:any):PaginationOptions{
   const page = Math.max(1,parseInt(query.page)||PAGINATION_DEFAULTS.PAGE);
   const limit = Math.min(
     Math.max(1,parseInt(query.limit || PAGINATION_DEFAULTS.LIMIT)),PAGINATION_DEFAULTS.MAX_LIMIT
   )
  const skip = (page - 1 ) * limit;
  const sortBy = query.sortBy;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc"

    return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };

}

export function calculatePaginationMetadata(
  totalCount: number,
  page: number,
  limit: number
): PaginationMetaData {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    limit,
  };
}


export function createPaginatedResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const metadata = calculatePaginationMetadata(totalCount, page, limit);

  return {
    data,
    ...metadata,
  };
}

export function buildSortOptions(sortBy?:string,sortOrder:'asc' | 'desc' = 'desc' ):Record<string,-1| 1>{
  if(!sortBy){
    return {createdAt:-1}
  }
  return{
    [sortOrder] : sortOrder === 'asc' ? 1 : -1,
  }
}

export const createPaginatedQuerySchema = <T extends z.ZodRawShape>(additionalFields: T) => {
  return z.object({
    query: z.object({
      ...additionalFields,
      page: z.string().transform(val => parseInt(val)).optional(),
      limit: z.string().transform(val => Math.min(parseInt(val), PAGINATION_DEFAULTS.MAX_LIMIT)).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  });
};