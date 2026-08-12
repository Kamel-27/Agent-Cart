import { listProducts } from "../src/lib/catalog";

async function main() {
  const featured = await listProducts({ categorySlug: "smartphones", sort: "relevance", perPage: 16, inStockOnly: true });
  console.log(`Found ${featured.products.length} landing page smartphones:`);
  for (const p of featured.products) {
    console.log(`- [${p.id}] ${p.brand} | ${p.title} | Slug: ${p.slug}`);
    console.log(`  Images: ${JSON.stringify(p.images)}`);
    console.log(`  Attrs: ${JSON.stringify(p.attrs)}`);
  }
}

main().catch(console.error);
