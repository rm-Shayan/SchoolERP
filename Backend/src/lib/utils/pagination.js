// ==========================================
// PAGINATION HELPERS
// ==========================================

/**
 * Normalize `page` / `pageSize` from a query object (or any object) with sane
 * defaults and caps. Avoids repetition across list endpoints.
 *
 * @param {Object} query        e.g. req.query
 * @param {number} [options.defaultPageSize=50]
 * @param {number} [options.maxPageSize=100]
 * @returns {{ page: number, pageSize: number, skip: number }}
 */
export const parsePagination = (query, { defaultPageSize = 50, maxPageSize = 100 } = {}) => {
  const page = Math.max(1, parseInt(query?.page, 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(query?.pageSize, 10) || defaultPageSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
};

/**
 * Wrap a list + total into a consistent paginated response shape.
 *
 * @param {Array}  items
 * @param {number} total
 * @param {{ page: number, pageSize: number }} pagination
 * @returns {{ items: Array, total: number, page: number, pageSize: number, totalPages: number }}
 */
export const paginateResult = (items, total, { page, pageSize }) => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
});
