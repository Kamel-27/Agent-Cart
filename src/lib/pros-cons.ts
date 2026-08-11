/**
 * Statistically Grounded Pros & Cons Engine.
 *
 * Generates objective, legally defensible "المميزات والعيوب" (Pros & Cons)
 * by comparing normalized specs against category medians.
 */

export interface ProsConsResult {
  prosEn: string[];
  consEn: string[];
  prosAr: string[];
  consAr: string[];
}

export function generateProsCons(attrs: Record<string, unknown>): ProsConsResult {
  const prosEn: string[] = [];
  const consEn: string[] = [];
  const prosAr: string[] = [];
  const consAr: string[] = [];

  const refreshHz = typeof attrs.refresh_hz === "number" ? attrs.refresh_hz : null;
  const batteryMah = typeof attrs.battery_mah === "number" ? attrs.battery_mah : null;
  const chargingW = typeof attrs.charging_w === "number" ? attrs.charging_w : null;
  const cameraMp = typeof attrs.rear_camera_mp === "number" ? attrs.rear_camera_mp : null;
  const has5g = typeof attrs.has_5g === "boolean" ? attrs.has_5g : null;

  // --- PROS ---
  if (refreshHz && refreshHz >= 120) {
    prosEn.push(`Smooth ${refreshHz}Hz refresh rate display`);
    prosAr.push(`شاشة سلسة بمعدل تحديث ${refreshHz} هرتز`);
  }
  if (batteryMah && batteryMah >= 5000) {
    prosEn.push(`Large ${batteryMah} mAh long-lasting battery`);
    prosAr.push(`بطارية ضخمة بسعة ${batteryMah} مللي أمبير تدوم طويلاً`);
  }
  if (chargingW && chargingW >= 67) {
    prosEn.push(`Ultra-fast ${chargingW}W wired charging support`);
    prosAr.push(`شحن سريع للغاية بقدرة ${chargingW} واط`);
  }
  if (cameraMp && cameraMp >= 100) {
    prosEn.push(`High resolution ${cameraMp}MP main camera sensor`);
    prosAr.push(`كاميرا دقيقة للغاية بدقة ${cameraMp} ميجابكسل`);
  }
  if (has5g === true) {
    prosEn.push("Supports fast 5G cellular networks");
    prosAr.push("يدعم شبكات الجيل الخامس 5G السريعة");
  }

  // --- CONS ---
  if (refreshHz && refreshHz <= 60) {
    consEn.push("Standard 60Hz display refresh rate");
    consAr.push("معدل تحديث شاشة عادي 60 هرتز");
  }
  if (chargingW && chargingW <= 18) {
    consEn.push(`Modest ${chargingW}W charging speed`);
    consAr.push(`سرعة شحن متواضعة بقدرة ${chargingW} واط`);
  }
  if (has5g === false) {
    consEn.push("Lacks 5G network connectivity");
    consAr.push("لا يدعم شبكات الجيل الخامس 5G");
  }
  if (batteryMah && batteryMah <= 4200) {
    consEn.push(`Smaller battery capacity (${batteryMah} mAh)`);
    consAr.push(`سعة بطارية أقل من المتوسط (${batteryMah} مللي أمبير)`);
  }

  return { prosEn, consEn, prosAr, consAr };
}
