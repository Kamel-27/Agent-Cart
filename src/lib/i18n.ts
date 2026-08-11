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
  "site.name": "موبيليا",
  "site.tagline": "متجر الموبايلات والذكاء الاصطناعي",
  "top.auth": "وكيل معتمد · أجهزة مغلقة بالكرتونة",
  "top.ship": "شحن مجاني للطلبات فوق 5,000 جنيه",
  "top.help": "خدمة العملاء 16123 · من 9ص حتى 11م",
  "nav.search": "ابحث عن iPhone، Samsung، realme…",
  "nav.account": "حسابي وطلباتي",
  "nav.cart": "السلة",
  "nav.allProducts": "كل الموبايلات",
  "nav.home": "الرئيسية",
  "nav.new": "وصل حديثاً",
  "nav.deals": "العروض",
  "nav.installments": "التقسيط",
  "nav.tradeIn": "استبدال",

  "hero.kicker": "متوفر الآن",
  "hero.title": "iPhone 15 Pro Max يوصلك في القاهرة بكرة.",
  "hero.body": "نسخة الشرق الأوسط بضمان محلي سنتين، مع فحص التفعيل في الفرع قبل دفع باقي المبلغ.",
  "hero.ctaPrimary": "اعرض الجهاز",
  "hero.ctaSecondary": "تصفح كل الموبايلات",

  "brands.title": "تسوق حسب الماركة",
  "brands.viewAll": "عرض الكل",

  "deals.title": "عروض الأسبوع",
  "deals.timer": "ينتهي خلال يومين و14 ساعة",

  "trade.kicker": "استبدال",
  "trade.title": "جهازك القديم يغطي جزء من الجديد",
  "trade.body": "احصل على تقييم خلال دقيقتين، أكّده في فرع مدينة نصر، ويتم خصم القيمة من الفاتورة فوراً.",
  "trade.cta": "احسب قيمة الاستبدال",

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

  "cart.title": "سلة المشتريات",
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
  "checkout.demoBody": "لم يتم ضبط Stripe، لذلك تم تسجيل الطلب بدون دفع فعلي.",
  "checkout.paidTitle": "تم استلام طلبك",
  "checkout.orderNumber": "رقم الطلب",
  "checkout.backHome": "العودة للرئيسية",

  "misc.results": "نتيجة",
  "misc.page": "صفحة",
  "misc.next": "التالي",
  "misc.prev": "السابق",
};

const EN: Dict = {
  "site.name": "Mobilia",
  "site.tagline": "Phone Store & AI",
  "top.auth": "Authorised dealer · sealed boxes only",
  "top.ship": "Free delivery over EGP 5,000",
  "top.help": "Support 16123 · 9am–11pm",
  "nav.search": "Search iPhone, Samsung, realme…",
  "nav.account": "Account & orders",
  "nav.cart": "Cart",
  "nav.allProducts": "All Phones",
  "nav.home": "Home",
  "nav.new": "New arrivals",
  "nav.deals": "Deals",
  "nav.installments": "Instalments",
  "nav.tradeIn": "Trade-in",

  "hero.kicker": "Flagship, in stock",
  "hero.title": "iPhone 15 Pro Max, delivered in Cairo tomorrow.",
  "hero.body": "Middle East spec, two-year local warranty, and an activation check in store before you pay the balance.",
  "hero.ctaPrimary": "View the phone",
  "hero.ctaSecondary": "Browse all smartphones",

  "brands.title": "Shop by brand",
  "brands.viewAll": "View all",

  "deals.title": "This week's deals",
  "deals.timer": "ENDS IN 2D 14H",

  "trade.kicker": "Trade-in",
  "trade.title": "Your old phone covers part of the new one",
  "trade.body": "Get a quote in two minutes, confirm it at the Nasr City branch, and the value comes off the invoice on the spot.",
  "trade.cta": "Get a trade-in quote",

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
  "search.count": "results",

  "checkout.demoTitle": "Demo order created",
  "checkout.demoBody": "Stripe is not configured, so this order was recorded without taking payment.",
  "checkout.paidTitle": "Order confirmed",
  "checkout.orderNumber": "Order",
  "checkout.backHome": "Back to home",

  "misc.results": "results",
  "misc.page": "Page",
  "misc.next": "Next",
  "misc.prev": "Previous",
};

const DICTS: Record<Locale, Dict> = { ar: AR, en: EN };

export function t(locale: Locale, key: string): string {
  return DICTS[locale][key] ?? DICTS.en[key] ?? key;
}

export function translator(locale: Locale): (key: string) => string {
  return (key) => t(locale, key);
}
