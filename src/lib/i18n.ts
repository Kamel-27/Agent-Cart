/**
 * Locale handling.
 *
 * Arabic is the default because the target market reads Arabic first, and RTL is
 * built in from the start rather than retrofitted (docs/PLAN.md §11, obstacle 10).
 * Retrofitting RTL means auditing every margin, padding, float, and icon in the
 * codebase; starting with it means using CSS logical properties and never
 * thinking about it again.
 *
 * This is a cookie-based locale, not route-based (`/ar/...`, `/en/...`). Route-
 * based i18n is the better long-term answer for SEO — each language gets its own
 * indexable URL — but it is a routing decision that touches every link in the
 * app, so it belongs in one deliberate change rather than smuggled in here.
 */

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

type Dict = Record<string, string>;

const AR: Dict = {
  "site.name": "عربة الوكيل",
  "site.tagline": "متجر إلكترونيات",
  "nav.search": "ابحث عن منتج…",
  "nav.cart": "السلة",
  "nav.allProducts": "كل المنتجات",
  "nav.home": "الرئيسية",

  "filters.title": "تصفية",
  "filters.brand": "الماركة",
  "filters.priceRange": "السعر",
  "filters.min": "من",
  "filters.max": "إلى",
  "filters.inStockOnly": "المتوفر فقط",
  "filters.apply": "تطبيق",
  "filters.clear": "مسح",
  "filters.sort": "ترتيب",

  "sort.relevance": "الأنسب",
  "sort.priceAsc": "الأرخص أولاً",
  "sort.priceDesc": "الأغلى أولاً",
  "sort.newest": "الأحدث",

  "product.addToCart": "أضف إلى السلة",
  "product.outOfStock": "غير متوفر",
  "product.inStock": "متوفر",
  "product.specs": "المواصفات",
  "product.unknown": "—",
  "product.was": "بدلاً من",
  "product.save": "وفّر",
  "product.noImage": "لا توجد صورة",

  "cart.title": "سلة التسوق",
  "cart.empty": "سلتك فارغة.",
  "cart.continue": "متابعة التسوق",
  "cart.remove": "حذف",
  "cart.update": "تحديث",
  "cart.quantity": "الكمية",
  "cart.subtotal": "الإجمالي",
  "cart.checkout": "إتمام الشراء",
  "cart.itemCount": "منتج",

  "search.resultsFor": "نتائج البحث عن",
  "search.noResults": "لا توجد نتائج.",
  "search.count": "منتج",

  "checkout.demoTitle": "تم إنشاء طلب تجريبي",
  "checkout.demoBody":
    "لم يتم ضبط Stripe، لذلك تم تسجيل الطلب بدون دفع فعلي. أضف STRIPE_SECRET_KEY لتفعيل الدفع.",
  "checkout.paidTitle": "تم استلام طلبك",
  "checkout.orderNumber": "رقم الطلب",
  "checkout.backHome": "العودة للرئيسية",

  "misc.results": "منتج",
  "misc.page": "صفحة",
  "misc.next": "التالي",
  "misc.prev": "السابق",
};

const EN: Dict = {
  "site.name": "Agent Cart",
  "site.tagline": "Electronics store",
  "nav.search": "Search products…",
  "nav.cart": "Cart",
  "nav.allProducts": "All products",
  "nav.home": "Home",

  "filters.title": "Filters",
  "filters.brand": "Brand",
  "filters.priceRange": "Price",
  "filters.min": "Min",
  "filters.max": "Max",
  "filters.inStockOnly": "In stock only",
  "filters.apply": "Apply",
  "filters.clear": "Clear",
  "filters.sort": "Sort",

  "sort.relevance": "Most relevant",
  "sort.priceAsc": "Price: low to high",
  "sort.priceDesc": "Price: high to low",
  "sort.newest": "Newest",

  "product.addToCart": "Add to cart",
  "product.outOfStock": "Out of stock",
  "product.inStock": "In stock",
  "product.specs": "Specifications",
  "product.unknown": "—",
  "product.was": "was",
  "product.save": "save",
  "product.noImage": "No image",

  "cart.title": "Your cart",
  "cart.empty": "Your cart is empty.",
  "cart.continue": "Continue shopping",
  "cart.remove": "Remove",
  "cart.update": "Update",
  "cart.quantity": "Qty",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Checkout",
  "cart.itemCount": "items",

  "search.resultsFor": "Results for",
  "search.noResults": "No results.",
  "search.count": "products",

  "checkout.demoTitle": "Demo order created",
  "checkout.demoBody":
    "Stripe is not configured, so this order was recorded without taking payment. Set STRIPE_SECRET_KEY to enable real checkout.",
  "checkout.paidTitle": "Order confirmed",
  "checkout.orderNumber": "Order",
  "checkout.backHome": "Back to home",

  "misc.results": "products",
  "misc.page": "Page",
  "misc.next": "Next",
  "misc.prev": "Previous",
};

const DICTS: Record<Locale, Dict> = { ar: AR, en: EN };

export function t(locale: Locale, key: string): string {
  return DICTS[locale][key] ?? DICTS.en[key] ?? key;
}

/** Bound translator, so components read `tr("cart.title")`. */
export function translator(locale: Locale): (key: string) => string {
  return (key) => t(locale, key);
}
