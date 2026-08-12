import type { Locale } from "@/lib/i18n";

/**
 * Footer columns are plain text, not links — same convention as the design
 * mock this app's look is based on. Most of these destinations (careers,
 * returns policy, FAQ…) don't exist as real pages yet, so a plain label is
 * honest; a styled `<a href="#">` would just be a dead link with better CSS.
 */
function footerColumns(isAr: boolean): Array<{ title: string; links: string[] }> {
  return isAr
    ? [
        { title: "عربة الوكيل", links: ["من نحن", "الفروع", "وظائف", "اتصل بنا"] },
        { title: "التسوق", links: ["الموبايلات", "العروض", "الأكثر مبيعاً", "الأحدث"] },
        { title: "خدمة العملاء", links: ["تتبع الطلب", "الإرجاع والاستبدال", "الضمان", "الأسئلة الشائعة"] },
        { title: "قانوني", links: ["الشروط والأحكام", "سياسة الخصوصية", "سياسة الاسترجاع"] },
      ]
    : [
        { title: "Agent Cart", links: ["About us", "Branches", "Careers", "Contact"] },
        { title: "Shop", links: ["Smartphones", "Deals", "Best sellers", "Newest"] },
        { title: "Customer service", links: ["Track order", "Returns & exchange", "Warranty", "FAQ"] },
        { title: "Legal", links: ["Terms of sale", "Privacy policy", "Refund policy"] },
      ];
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const columns = footerColumns(isAr);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              {col.links.map((link) => (
                <div className="footer-link" key={link}>
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-rule" />

        <div className="footer-bottom">
          <span>{isAr ? `© ${year} عربة الوكيل` : `© ${year} Agent Cart`}</span>
          <div className="spacer" />
          <span>{isAr ? "Visa · Mastercard · دفع آمن" : "Visa · Mastercard · Secure card payment"}</span>
        </div>
      </div>
    </footer>
  );
}
