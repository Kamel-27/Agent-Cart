/**
 * Catalog Adapter.
 *
 * Re-exports catalog operations from @/services/catalog.service.
 */

export {
  listCategories,
  listProducts,
  getProductBySlug,
  getProductById,
  getCategoryBySlug,
  getRelatedProducts,
  getProductVariants,
  type ProductRow,
  type ProductVariant,
  type AttrSchemaEntry,
  type CategoryRow,
  type SortKey,
  type CatalogFilters,
  type CatalogResult,
} from "@/services/catalog.service";
