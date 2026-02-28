/**
 * Build a WhatsApp wa.me URL with a pre-filled Hebrew message template.
 */
export function buildWhatsAppUrl(
  phone: string,
  contactName?: string | null,
  dealTitleOrLastNote?: string | null,
  lastNote?: string | null
): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return "";

  // When called with 5 args: (phone, name, dealTitle, lastNote)
  // When called with 3 args from dashboard: (phone, name, lastNote) — lastNote is in dealTitleOrLastNote

  if (contactName && lastNote) {
    // 5-arg form: has both dealTitle and lastNote — prefer lastNote for follow-up
    const text = `היי ${contactName}, המשך לשיחתנו — ${lastNote.slice(0, 80)}. מתי נוח לדבר?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  if (contactName && dealTitleOrLastNote) {
    const cleanTitle = dealTitleOrLastNote.replace(/^ליד:\s*/i, "");
    const text = `היי ${contactName}, קיבלתי את הפנייה שלך לגבי ${cleanTitle}. אשמח לדבר על הפרטים, מתי נוח לך?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  if (contactName) {
    const text = `היי ${contactName}, מה שלומך? רציתי לבדוק אם יש משהו שאני יכול לעזור בו.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  return `https://wa.me/${cleanPhone}`;
}
