/** Notification and email wording per language. {placeholders} are filled at send time. */
import type { Locale } from "./config";

export type NoticeKey = "welcome" | "consultRequested" | "quoteReceived" | "paymentReceived" | "paymentRejected" | "orderCancelled" | "orderRefunded" | "consultUpdated" | "quoteReady" | "projectPublished" | "projectUpdated";
export type EmailKey = "consultConfirm" | "quoteConfirm" | "passwordReset" | "newsletterConfirm";

type Pair = { title: string; body: string };

export const NOTICES: Record<Locale, Record<NoticeKey, Pair>> = {
  en: {
    welcome: { title: "Welcome to Architecture 3D", body: "Your account is ready. Save designs in the studio, request quotes and track consultations from your account." },
    consultRequested: { title: "Consultation requested", body: "Reference {ref}. An architect will contact you to confirm a time." },
    quoteReceived: { title: "Quote request received", body: "Reference {ref}. We will reply with a quote or questions." },
    paymentReceived: { title: "Payment received for {ref}", body: "Thank you. {item} is now active on your account." },
    paymentRejected: { title: "Payment for {ref} could not be verified", body: "{reason}" },
    orderCancelled: { title: "Order {ref} cancelled", body: "{note}" },
    orderRefunded: { title: "Order {ref} refunded", body: "{note}" },
    consultUpdated: { title: "Consultation {ref} updated", body: "{when}" },
    quoteReady: { title: "Your quote {ref} is ready", body: "Quoted {amount}." },
    projectPublished: { title: "Project published: {title}", body: "Your project is now visible in the gallery." },
    projectUpdated: { title: "Project updated: {title}", body: "The review status of your project has changed." },
  },
  ar: {
    welcome: { title: "مرحبًا بك في Architecture 3D", body: "حسابك جاهز. احفظ التصاميم في الاستوديو، واطلب عروض الأسعار، وتابع الاستشارات من حسابك." },
    consultRequested: { title: "تم طلب الاستشارة", body: "المرجع {ref}. سيتواصل معك معماري لتأكيد الموعد." },
    quoteReceived: { title: "تم استلام طلب عرض السعر", body: "المرجع {ref}. سنرد بعرض سعر أو بأسئلة." },
    paymentReceived: { title: "تم استلام الدفعة للطلب {ref}", body: "شكرًا لك. أصبح {item} فعّالًا في حسابك." },
    paymentRejected: { title: "تعذّر التحقق من دفعة الطلب {ref}", body: "{reason}" },
    orderCancelled: { title: "أُلغي الطلب {ref}", body: "{note}" },
    orderRefunded: { title: "استُرد مبلغ الطلب {ref}", body: "{note}" },
    consultUpdated: { title: "تحديث الاستشارة {ref}", body: "{when}" },
    quoteReady: { title: "عرض السعر {ref} جاهز", body: "السعر المقترح {amount}." },
    projectPublished: { title: "نُشر المشروع: {title}", body: "أصبح مشروعك ظاهرًا في المعرض." },
    projectUpdated: { title: "تحديث المشروع: {title}", body: "تغيّرت حالة مراجعة مشروعك." },
  },
  ckb: {
    welcome: { title: "بەخێربێیت بۆ Architecture 3D", body: "هەژمارەکەت ئامادەیە. دیزاین لە ستۆدیۆدا پاشەکەوت بکە، داوای نرخ بکە و ڕاوێژەکانت لە هەژمارەکەتەوە بەدوادا بچۆ." },
    consultRequested: { title: "داوای ڕاوێژ کرا", body: "ئاماژە {ref}. تەلارسازێک پەیوەندیت پێوە دەکات بۆ جێگیرکردنی کات." },
    quoteReceived: { title: "داوای نرخ وەرگیرا", body: "ئاماژە {ref}. بە نرخ یان پرسیار وەڵام دەدەینەوە." },
    paymentReceived: { title: "پارەدانی {ref} وەرگیرا", body: "سوپاس. {item} ئێستا لە هەژمارەکەتدا چالاکە." },
    paymentRejected: { title: "پارەدانی {ref} پشتڕاست نەکرایەوە", body: "{reason}" },
    orderCancelled: { title: "داواکاری {ref} هەڵوەشێنرایەوە", body: "{note}" },
    orderRefunded: { title: "پارەی داواکاری {ref} گەڕێنرایەوە", body: "{note}" },
    consultUpdated: { title: "ڕاوێژی {ref} نوێکرایەوە", body: "{when}" },
    quoteReady: { title: "نرخی {ref} ئامادەیە", body: "نرخی دانراو {amount}." },
    projectPublished: { title: "پڕۆژە بڵاوکرایەوە: {title}", body: "پڕۆژەکەت ئێستا لە پێشانگادا دیارە." },
    projectUpdated: { title: "پڕۆژە نوێکرایەوە: {title}", body: "دۆخی پێداچوونەوەی پڕۆژەکەت گۆڕا." },
  },
};

export const EMAILS: Record<Locale, Record<EmailKey, { subject: string; body: string }>> = {
  en: {
    consultConfirm: { subject: "We received your consultation request ({ref})", body: "Hello {name},\n\nThank you for your request about \"{topic}\". An architect will contact you to confirm a time.\n\nReference: {ref}" },
    quoteConfirm: { subject: "Your quote request {ref}", body: "Hello {name},\n\nWe received your quote request and will reply with a proposal or questions.\n\nReference: {ref}" },
    passwordReset: { subject: "Reset your Architecture 3D password", body: "Someone asked to reset the password for this account.\n\nReset it here (valid for one hour):\n{link}\n\nIf this was not you, ignore this email; your password stays the same." },
    newsletterConfirm: { subject: "Confirm your subscription", body: "Please confirm you want project notes from Architecture 3D:\n{link}\n\nIf you did not ask for this, ignore this email." },
  },
  ar: {
    consultConfirm: { subject: "استلمنا طلب الاستشارة ({ref})", body: "مرحبًا {name}،\n\nشكرًا لطلبك بخصوص «{topic}». سيتواصل معك معماري لتأكيد الموعد.\n\nالمرجع: {ref}" },
    quoteConfirm: { subject: "طلب عرض السعر {ref}", body: "مرحبًا {name}،\n\nاستلمنا طلب عرض السعر وسنرد بمقترح أو بأسئلة.\n\nالمرجع: {ref}" },
    passwordReset: { subject: "إعادة تعيين كلمة مرور Architecture 3D", body: "طلب أحدهم إعادة تعيين كلمة مرور هذا الحساب.\n\nأعد تعيينها من هنا (صالح لمدة ساعة):\n{link}\n\nإن لم تكن أنت، فتجاهل هذه الرسالة؛ تبقى كلمة مرورك كما هي." },
    newsletterConfirm: { subject: "أكّد اشتراكك", body: "يرجى تأكيد رغبتك في تلقي ملاحظات المشاريع من Architecture 3D:\n{link}\n\nإن لم تطلب ذلك، فتجاهل هذه الرسالة." },
  },
  ckb: {
    consultConfirm: { subject: "داواکاری ڕاوێژەکەت وەرگیرا ({ref})", body: "سڵاو {name}،\n\nسوپاس بۆ داواکارییەکەت دەربارەی «{topic}». تەلارسازێک پەیوەندیت پێوە دەکات بۆ جێگیرکردنی کات.\n\nئاماژە: {ref}" },
    quoteConfirm: { subject: "داوای نرخی {ref}", body: "سڵاو {name}،\n\nداوای نرخەکەت وەرگیرا و بە پێشنیار یان پرسیار وەڵام دەدەینەوە.\n\nئاماژە: {ref}" },
    passwordReset: { subject: "ڕێکخستنەوەی وشەی نهێنی Architecture 3D", body: "کەسێک داوای ڕێکخستنەوەی وشەی نهێنی ئەم هەژمارەی کردووە.\n\nلێرەوە ڕێکی بخەرەوە (بۆ یەک کاتژمێر کار دەکات):\n{link}\n\nئەگەر تۆ نەبوویت، ئەم ئیمەیڵە پشتگوێ بخە؛ وشەی نهێنییەکەت وەک خۆی دەمێنێتەوە." },
    newsletterConfirm: { subject: "بەشدارییەکەت پشتڕاست بکەرەوە", body: "تکایە پشتڕاستی بکەرەوە کە دەتەوێت تێبینییەکانی پڕۆژە لە Architecture 3D وەربگریت:\n{link}\n\nئەگەر داوات نەکردووە، ئەم ئیمەیڵە پشتگوێ بخە." },
  },
};
