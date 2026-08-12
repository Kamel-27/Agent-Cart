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
  "site.tagline": "متجر إلكترونيات بمساعدة الذكاء الاصطناعي",
  "top.auth": "وكيل معتمد · أجهزة أصلية مغلقة بالكرتونة",
  "top.ship": "شحن مجاني للطلبات فوق 5,000 جنيه",
  "top.help": "خدمة العملاء 16123 · من 9ص حتى 11م",
  "nav.search": "ابحث عن iPhone، Samsung، realme…",
  "nav.cart": "السلة",
  "nav.allProducts": "كل الموبايلات",
  "nav.home": "الرئيسية",
  "nav.compare": "مقارنة",

  "hero.kicker": "متوفر الآن",
  "hero.title": "أحدث الموبايلات بأفضل الأسعار في مصر",
  "hero.body": "تشكيلة واسعة من أشهر الماركات، مقارنة فورية بين المواصفات، وشراء آمن عبر بطاقتك الائتمانية.",
  "hero.ctaPrimary": "تسوق الموبايلات",
  "hero.ctaSecondary": "قارن بين الأجهزة",

  "trust.genuine.title": "أجهزة أصلية موثقة",
  "trust.genuine.body": "كل منتج مرتبط بضمانه الرسمي ومصدره في صفحة المنتج",
  "trust.payment.title": "دفع آمن بالبطاقة",
  "trust.payment.body": "الدفع عبر Stripe — بيانات بطاقتك لا تمر على خوادمنا أبداً",
  "trust.pricing.title": "أسعار واضحة",
  "trust.pricing.body": "السعر المعروض هو السعر النهائي، بدون رسوم مخفية عند الدفع",
  "trust.compare.title": "مقارنة دقيقة",
  "trust.compare.body": "قارن المواصفات جنباً إلى جنب قبل ما تقرر",

  "brands.title": "تسوق حسب الماركة",
  "brands.viewAll": "عرض الكل",

  "deals.title": "الأكثر مبيعاً",
  "deals.subtitle": "أجهزة أصلية متوفرة الآن",
  "new.title": "أحدث الإضافات",
  "new.subtitle": "أحدث الطُرز في الكتالوج",

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
  "product.specs": "المواصفات الكاملة",
  "product.unknown": "—",
  "product.was": "بدلاً من",
  "product.save": "وفّر",
  "product.noImage": "لا توجد صورة",
  "product.reviews": "تقييم",
  "product.compare": "قارن هذا الهاتف",
  "product.pros": "المميزات",
  "product.cons": "العيوب",
  "product.similar": "هواتف مشابهة قد تعجبك",

  "assurance.auth.title": "فحص الأصالة",
  "assurance.auth.body": "كل جهاز مطابق لمواصفاته المعلنة قبل الشحن",
  "assurance.warranty.title": "ضمان رسمي",
  "assurance.warranty.body": "حسب سياسة الماركة والموزع المعتمد",
  "assurance.pay.title": "دفع آمن",
  "assurance.pay.body": "عبر Stripe، بدون تخزين بيانات بطاقتك عندنا",

  "cart.title": "سلة المشتريات",
  "cart.empty": "سلتك فارغة.",
  "cart.continue": "متابعة التسوق",
  "cart.remove": "حذف",
  "cart.update": "تحديث",
  "cart.quantity": "الكمية",
  "cart.subtotal": "الإجمالي الفرعي",
  "cart.total": "الإجمالي",
  "cart.checkout": "إتمام الشراء",
  "cart.itemCount": "منتج",
  "cart.increase": "زيادة الكمية",
  "cart.decrease": "إنقاص الكمية",
  "cart.securePay": "دفع آمن عبر بطاقتك الائتمانية",

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
  "site.tagline": "AI-assisted electronics store",
  "top.auth": "Authorised dealer · sealed, genuine devices",
  "top.ship": "Free delivery over EGP 5,000",
  "top.help": "Support 16123 · 9am–11pm",
  "nav.search": "Search iPhone, Samsung, realme…",
  "nav.cart": "Cart",
  "nav.allProducts": "All Phones",
  "nav.home": "Home",
  "nav.compare": "Compare",

  "hero.kicker": "In stock now",
  "hero.title": "Latest smartphones at the best prices in Egypt",
  "hero.body": "A wide range from the brands you know, instant side-by-side spec comparison, and secure card checkout.",
  "hero.ctaPrimary": "Shop smartphones",
  "hero.ctaSecondary": "Compare phones",

  "trust.genuine.title": "Verified genuine devices",
  "trust.genuine.body": "Every listing links its official warranty and source on the product page",
  "trust.payment.title": "Secure card payment",
  "trust.payment.body": "Checkout runs through Stripe — your card details never touch our servers",
  "trust.pricing.title": "Transparent pricing",
  "trust.pricing.body": "The price you see is the price you pay, no hidden fees at checkout",
  "trust.compare.title": "Real spec comparison",
  "trust.compare.body": "Compare devices side by side before you decide",

  "brands.title": "Shop by brand",
  "brands.viewAll": "View all",

  "deals.title": "Best selling",
  "deals.subtitle": "Genuine devices in stock now",
  "new.title": "New releases",
  "new.subtitle": "The newest models in the catalog",

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
  "product.specs": "Full specifications",
  "product.unknown": "—",
  "product.was": "was",
  "product.save": "save",
  "product.noImage": "No image",
  "product.reviews": "reviews",
  "product.compare": "Compare this phone",
  "product.pros": "Pros",
  "product.cons": "Cons",
  "product.similar": "Similar smartphones",

  "assurance.auth.title": "Authenticity checked",
  "assurance.auth.body": "Every device is verified against its listed specs before shipping",
  "assurance.warranty.title": "Official warranty",
  "assurance.warranty.body": "Per the brand's and authorised distributor's policy",
  "assurance.pay.title": "Secure payment",
  "assurance.pay.body": "Processed by Stripe — we never store your card details",

  "cart.title": "Your cart",
  "cart.empty": "Your cart is empty.",
  "cart.continue": "Continue shopping",
  "cart.remove": "Remove",
  "cart.update": "Update",
  "cart.quantity": "Qty",
  "cart.subtotal": "Subtotal",
  "cart.total": "Total",
  "cart.checkout": "Checkout",
  "cart.itemCount": "items",
  "cart.increase": "Increase quantity",
  "cart.decrease": "Decrease quantity",
  "cart.securePay": "Secure checkout via your credit card",

  "search.resultsFor": "Results for",
  "search.noResults": "No results.",
  "search.count": "results",

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
