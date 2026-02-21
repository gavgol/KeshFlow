/**
 * Build a WhatsApp wa.me URL with a pre-filled Hebrew message template.
 */
export function buildWhatsAppUrl(
  phone: string,
  contactName?: string | null,
  dealTitle?: string | null
): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return "";

  if (contactName && dealTitle) {
    const cleanTitle = dealTitle.replace(/^ליד:\s*/i, "");
    const text = `היי ${contactName}, קיבלתי את הפנייה שלך לגבי ${cleanTitle}. אשמח לדבר על הפרטים, מתי נוח לך?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  if (contactName) {
    const text = `היי ${contactName}, מה שלומך? רציתי לבדוק אם יש משהו שאני יכול לעזור בו.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  return `https://wa.me/${cleanPhone}`;
}
