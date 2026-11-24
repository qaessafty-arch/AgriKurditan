/** Rules-engine wording in each language. {placeholders} are filled by rules.ts. */
import type { Locale } from "@/i18n/config";

export interface RulesText {
  spaces: Record<"lobby" | "lettable" | "meeting" | "core" | "services" | "living" | "kitchen" | "entry" | "master" | "bedrooms" | "baths" | "guest" | "circulation", [string, string]>;
  materials: Record<"travertine" | "limestone" | "concrete" | "plaster" | "lowIron" | "solar" | "fins" | "louvers" | "green", [string, string]>;
  glassReason: string;
  summary: string; setbacks: string; coverage: string; photos: string; photosOne: string; noPhotos: string;
  massingOne: string; massingMany: string; considerations: string[]; budget: string; noBudget: string; nextSteps: string[];
  disclaimer: string;
  fallbackNotice: string;
}

const en: RulesText = {
  spaces: {
    lobby: ["Entrance lobby", "Double-height if budget allows; visible from the street."],
    lettable: ["Lettable workspace", "Open floor plates around a single core for flexible leasing."],
    meeting: ["Meeting and amenity rooms", "Shared between tenants."],
    core: ["Stair and lift core", "Positioned to keep floor plates column-free."],
    services: ["Services and storage", "Plant, refuse and storage at ground level."],
    living: ["Living room", "Oriented to the garden, shaded from western sun."],
    kitchen: ["Kitchen and dining", "Connected to the terrace for outdoor dining."],
    entry: ["Entrance hall", "Guest WC and storage off the entrance."],
    master: ["Master suite", "Bedroom with en-suite and dressing area."],
    bedrooms: ["Bedrooms ({n})", "Each with built-in storage."],
    baths: ["Bathrooms ({n})", "Including one accessible bathroom on the ground floor."],
    guest: ["Guest room or study", "Flexible room for guests, work or elderly relatives."],
    circulation: ["Walls and circulation (≈15%)", "Corridors, stairs and wall thickness."],
  },
  materials: {
    travertine: ["Travertine cladding", "Thermal mass moderates hot summer days; durable and repairable."],
    limestone: ["Limestone", "Regionally sourced stone with good thermal mass and a long service life."],
    concrete: ["Board-formed concrete", "Robust and fire-resistant; exposed finishes reduce maintenance and cladding cost."],
    plaster: ["Mineral plaster", "Economical, breathable render; easy to repair and repaint."],
    lowIron: ["Low-iron double glazing", ""], solar: ["Solar-control double glazing", ""],
    fins: ["Vertical shading fins", "Blocks low-angle east and west sun."],
    louvers: ["Horizontal louvres", "Shades high summer sun on south facades."],
    green: ["Extensive green roof", "Insulates the top floor and retains stormwater."],
  },
  glassReason: "Reduces solar heat gain on south and west facades.",
  summary: "A {floors}-storey {type} building of about {gross} m² gross on a {w} × {d} m plot ({plot} m²), with a footprint of roughly {fp} m².",
  setbacks: "Indicative buildable zone after typical setbacks: {bw} × {bd} m ({ba} m²). Confirm setbacks with the local municipality.",
  coverage: "Assumed maximum plot coverage of 60% gives up to {max} m² of footprint.",
  photos: "{n} site photos were attached for the architect. The built-in engine does not analyse images.",
  photosOne: "1 site photo was attached for the architect. The built-in engine does not analyse images.",
  noPhotos: "No site photos attached; photos help the architect assess slope, access, neighbours and views.",
  massingOne: "Single-storey building set back from the street, opening to a garden on the private side.",
  massingMany: "Compact {floors}-storey volume, with upper floors shading the ground-floor glazing and terraces facing the garden.",
  considerations: [
    "Orient main living spaces away from direct western sun; shade glazing on south and west facades.",
    "Plan for cross-ventilation and ceiling fans to reduce cooling loads in summer.",
    "Seismic design and foundations must be designed by a structural engineer after a soil investigation.",
    "Confirm zoning, height limits, setbacks and parking requirements with the municipality before design development.",
  ],
  budget: "Your budget corresponds to about {perM2} {currency} per m² of gross floor area. Ask the architect whether this suits the intended specification level in your area.",
  noBudget: "No budget was given. A budget range helps the architect set the right specification level.",
  nextSteps: [
    "Book a consultation to review the brief, site and budget with an architect.",
    "Commission a topographic survey and soil investigation.",
    "Open the suggested design in the studio and adjust materials and layout preferences.",
  ],
  fallbackNotice: "The AI service was unavailable, so this brief was produced by our built-in rules engine instead.",
  disclaimer: "This is a preliminary, AI-assisted design suggestion for discussion only. It is not a certified engineering drawing or a construction-ready plan, and it makes no claim about structural safety, building-code or permit compliance. A qualified, licensed architect and engineer must review and develop any design before it is built.",
};

const ar: RulesText = {
  spaces: {
    lobby: ["ردهة المدخل", "بارتفاع مضاعف إن سمحت الميزانية؛ ظاهرة من الشارع."],
    lettable: ["مساحات عمل للتأجير", "طوابق مفتوحة حول نواة واحدة لتأجير مرن."],
    meeting: ["قاعات الاجتماعات والخدمات", "مشتركة بين المستأجرين."],
    core: ["نواة السلّم والمصعد", "موضوعة لإبقاء الطوابق بلا أعمدة."],
    services: ["الخدمات والتخزين", "المعدات والنفايات والتخزين في الطابق الأرضي."],
    living: ["غرفة المعيشة", "موجهة نحو الحديقة ومظللة من شمس الغرب."],
    kitchen: ["المطبخ والطعام", "متصلة بالشرفة لتناول الطعام في الخارج."],
    entry: ["صالة المدخل", "دورة مياه للضيوف وتخزين قرب المدخل."],
    master: ["الجناح الرئيسي", "غرفة نوم مع حمّام ملحق وغرفة ملابس."],
    bedrooms: ["غرف النوم ({n})", "لكل منها خزائن مدمجة."],
    baths: ["الحمّامات ({n})", "منها حمّام مهيأ لذوي الاحتياجات في الطابق الأرضي."],
    guest: ["غرفة ضيوف أو مكتب", "غرفة مرنة للضيوف أو العمل أو كبار السن."],
    circulation: ["الجدران والحركة (≈١٥٪)", "الممرات والسلالم وسماكة الجدران."],
  },
  materials: {
    travertine: ["تكسية ترافرتين", "الكتلة الحرارية تلطّف أيام الصيف الحارة؛ متين وقابل للإصلاح."],
    limestone: ["حجر جيري", "حجر محلي بكتلة حرارية جيدة وعمر خدمة طويل."],
    concrete: ["خرسانة بقوالب خشبية", "متينة ومقاومة للحريق؛ التشطيب الظاهر يقلل الصيانة وتكلفة التكسية."],
    plaster: ["لياسة معدنية", "لياسة اقتصادية قابلة للتنفس؛ سهلة الإصلاح وإعادة الطلاء."],
    lowIron: ["زجاج مزدوج منخفض الحديد", ""], solar: ["زجاج مزدوج عاكس للشمس", ""],
    fins: ["زعانف تظليل عمودية", "تحجب الشمس المنخفضة من الشرق والغرب."],
    louvers: ["كاسرات أفقية", "تظلل شمس الصيف المرتفعة على الواجهات الجنوبية."],
    green: ["سطح أخضر", "يعزل الطابق العلوي ويحتفظ بمياه الأمطار."],
  },
  glassReason: "يقلل اكتساب الحرارة الشمسية على الواجهات الجنوبية والغربية.",
  summary: "مبنى {type} من {floors} طوابق بمساحة إجمالية تقارب {gross} م² على قطعة أرض {w} × {d} م ({plot} م²)، بمسقط يقارب {fp} م².",
  setbacks: "منطقة البناء التقريبية بعد الارتدادات المعتادة: {bw} × {bd} م ({ba} م²). تأكد من الارتدادات لدى البلدية.",
  coverage: "بافتراض نسبة تغطية قصوى ٦٠٪ يصل المسقط إلى {max} م².",
  photos: "أُرفقت {n} صور للموقع للمعماري. لا يحلل المحرّك المدمج الصور.",
  photosOne: "أُرفقت صورة واحدة للموقع للمعماري. لا يحلل المحرّك المدمج الصور.",
  noPhotos: "لم تُرفق صور للموقع؛ تساعد الصور المعماري على تقييم الانحدار والوصول والجيران والإطلالات.",
  massingOne: "مبنى من طابق واحد مرتد عن الشارع، ينفتح على حديقة في الجهة الخاصة.",
  massingMany: "كتلة مدمجة من {floors} طوابق، تظلل فيها الطوابق العليا زجاج الطابق الأرضي، مع شرفات مطلة على الحديقة.",
  considerations: [
    "وجّه مساحات المعيشة الرئيسية بعيدًا عن شمس الغرب المباشرة، وظلل الزجاج على الواجهات الجنوبية والغربية.",
    "خطط لتهوية عرضية ومراوح سقفية لتقليل أحمال التبريد صيفًا.",
    "يجب أن يصمم مهندس إنشائي الأساسات ومقاومة الزلازل بعد فحص التربة.",
    "تأكد من التنظيم وحدود الارتفاع والارتدادات ومتطلبات المواقف لدى البلدية قبل تطوير التصميم.",
  ],
  budget: "تعادل ميزانيتك نحو {perM2} {currency} لكل م² من المساحة الإجمالية. اسأل المعماري إن كان ذلك يناسب مستوى المواصفات المطلوب في منطقتك.",
  noBudget: "لم تُحدَّد ميزانية. يساعد نطاق الميزانية المعماري على تحديد مستوى المواصفات المناسب.",
  nextSteps: ["احجز استشارة لمراجعة الموجز والموقع والميزانية مع معماري.", "اطلب رفعًا طبوغرافيًا وفحصًا للتربة.", "افتح التصميم المقترح في الاستوديو وعدّل المواد والتوزيع."],
  fallbackNotice: "خدمة الذكاء الاصطناعي غير متاحة حاليًا، لذا أُعدّ هذا الموجز بمحرّك القواعد المدمج.",
  disclaimer: "هذا اقتراح تصميم أولي بمساعدة الذكاء الاصطناعي للنقاش فقط. ليس مخططًا هندسيًا معتمدًا ولا خطة جاهزة للتنفيذ، ولا يدّعي السلامة الإنشائية أو المطابقة لقوانين البناء والتراخيص. يجب أن يراجع أي تصميم ويطوّره معماري ومهندس مؤهلان ومرخّصان قبل بنائه.",
};

const ckb: RulesText = {
  spaces: {
    lobby: ["هۆڵی دەروازە", "ئەگەر بودجە ڕێگە بدات دوو بەرزی؛ لە شەقامەوە دیار."],
    lettable: ["شوێنی کاری کرێدان", "نهۆمی کراوە لە دەوری یەک ناوک بۆ بەکرێدانی نەرم."],
    meeting: ["ژووری کۆبوونەوە و خزمەتگوزاری", "هاوبەشی نێوان کرێچییەکان."],
    core: ["ناوکی پلیکانە و ئاسانسۆر", "بە شێوەیەک دانراوە کە نهۆمەکان بێ ستوون بمێننەوە."],
    services: ["خزمەتگوزاری و هەڵگرتن", "ئامێر، خاشاک و هەڵگرتن لە نهۆمی خوارەوە."],
    living: ["ژووری دانیشتن", "ڕووەو باخچە و لە خۆری ڕۆژئاوا سێبەر کراوە."],
    kitchen: ["چێشتخانە و نانخواردن", "پەیوەستە بە هەیوانەوە بۆ نانخواردن لە دەرەوە."],
    entry: ["هۆڵی دەروازە", "ئاودەستی میوان و هەڵگرتن لە نزیک دەروازە."],
    master: ["سویتی سەرەکی", "ژووری نووستن لەگەڵ گەرماوی پەیوەست و شوێنی جلوبەرگ."],
    bedrooms: ["ژووری نووستن ({n})", "هەر یەکەیان دۆڵابی تێدایە."],
    baths: ["گەرماو ({n})", "لەوانە یەک گەرماوی گونجاو بۆ کەم ئەندامان لە نهۆمی خوارەوە."],
    guest: ["ژووری میوان یان کار", "ژوورێکی نەرم بۆ میوان، کار یان بەساڵاچووان."],
    circulation: ["دیوار و ڕێڕەو (≈١٥٪)", "ڕاڕەو، پلیکانە و ئەستووری دیوار."],
  },
  materials: {
    travertine: ["داپۆشینی ترافەرتین", "بارستایی گەرمی ڕۆژانی گەرمی هاوین ئاسان دەکات؛ بەهێز و چاککراوە."],
    limestone: ["بەردی کلس", "بەردی ناوچەیی بە بارستایی گەرمی باش و تەمەنی درێژ."],
    concrete: ["کۆنکرێتی قاڵبی تەختە", "بەهێز و بەرگەگری ئاگر؛ ڕووی دیار چاککاری و تێچووی داپۆشین کەم دەکاتەوە."],
    plaster: ["سواخی کانزایی", "سواخێکی هەرزان و هەناسەدەر؛ چاککردنەوە و بۆیەکردنەوەی ئاسانە."],
    lowIron: ["شووشەی دووچینی کەم ئاسن", ""], solar: ["شووشەی دووچینی ڕەتکەرەوەی خۆر", ""],
    fins: ["باڵچەی ستوونی سێبەر", "خۆری نزمی ڕۆژهەڵات و ڕۆژئاوا دەگرێت."],
    louvers: ["لۆڤەری ئاسۆیی", "سێبەر دەخاتە سەر خۆری بەرزی هاوین لە ڕووکاری باشوور."],
    green: ["سەربانی سەوز", "نهۆمی سەرەوە ئینسولە دەکات و ئاوی باران دەهێڵێتەوە."],
  },
  glassReason: "وەرگرتنی گەرمی خۆر لە ڕووکاری باشوور و ڕۆژئاوا کەم دەکاتەوە.",
  summary: "بینایەکی {type}ی {floors} نهۆمی بە کۆی ڕووبەری نزیکەی {gross} م² لەسەر زەوییەکی {w} × {d} م ({plot} م²)، بە بنکەیەکی نزیکەی {fp} م².",
  setbacks: "ناوچەی بیناسازی نزیکەیی دوای دوورکەوتنەوە ئاساییەکان: {bw} × {bd} م ({ba} م²). لە شارەوانی دوورکەوتنەوەکان پشتڕاست بکەرەوە.",
  coverage: "بە گریمانەی زۆرترین ڕێژەی داپۆشینی ٦٠٪، بنکە تا {max} م² دەگات.",
  photos: "{n} وێنەی زەوی بۆ تەلارساز هاوپێچ کرا. بزوێنەرە ناوخۆییەکە وێنە شی ناکاتەوە.",
  photosOne: "یەک وێنەی زەوی بۆ تەلارساز هاوپێچ کرا. بزوێنەرە ناوخۆییەکە وێنە شی ناکاتەوە.",
  noPhotos: "هیچ وێنەیەکی زەوی هاوپێچ نەکراوە؛ وێنەکان یارمەتی تەلارساز دەدەن لێژی، ڕێگەی گەیشتن، دراوسێ و دیمەنەکان هەڵبسەنگێنێت.",
  massingOne: "بینایەکی یەک نهۆمی کە لە شەقام دوورە و بەسەر باخچەیەکدا لە لای تایبەتەوە دەکرێتەوە.",
  massingMany: "قەبارەیەکی چڕی {floors} نهۆمی، کە نهۆمەکانی سەرەوە سێبەر دەخەنە سەر شووشەی نهۆمی خوارەوە و هەیوانەکان ڕووەو باخچەن.",
  considerations: [
    "شوێنە سەرەکییەکانی دانیشتن لە خۆری ڕاستەوخۆی ڕۆژئاوا دوور بخەرەوە؛ شووشەی ڕووکاری باشوور و ڕۆژئاوا سێبەر بکە.",
    "بۆ کەمکردنەوەی بارستایی فێنککردنەوە لە هاویندا، هەواگۆڕکێی بەرانبەر و پانکەی بنمیچ پلان بکە.",
    "دیزاینی بوومەلەرزە و بناغە دەبێت دوای پشکنینی خاک لەلایەن ئەندازیارێکی پەیکەرییەوە بکرێت.",
    "پێش پەرەپێدانی دیزاین، پلاندانان، سنووری بەرزی، دوورکەوتنەوە و پێداویستی پارکینگ لە شارەوانی پشتڕاست بکەرەوە.",
  ],
  budget: "بودجەکەت نزیکەی {perM2} {currency} بۆ هەر م²ی کۆی ڕووبەر دەکات. لە تەلارساز بپرسە ئایا ئەمە لەگەڵ ئاستی تایبەتمەندی مەبەست لە ناوچەکەتدا دەگونجێت.",
  noBudget: "هیچ بودجەیەک دیاری نەکراوە. مەودای بودجە یارمەتی تەلارساز دەدات ئاستی گونجاوی تایبەتمەندی دیاری بکات.",
  nextSteps: ["کاتی ڕاوێژ دابنێ بۆ پێداچوونەوە بە کورتە، زەوی و بودجە لەگەڵ تەلارسازێک.", "ڕووپێوی تۆپۆگرافی و پشکنینی خاک داوا بکە.", "دیزاینە پێشنیارکراوەکە لە ستۆدیۆدا بکەرەوە و کەرەستە و دابەشکردن بگۆڕە."],
  fallbackNotice: "خزمەتگوزاری زیرەکی دەستکرد بەردەست نەبوو، بۆیە ئەم کورتەیە لەلایەن بزوێنەری یاساکانی خۆمانەوە ئامادە کرا.",
  disclaimer: "ئەمە پێشنیارێکی سەرەتایی دیزاینە بە یارمەتی زیرەکی دەستکرد، تەنها بۆ گفتوگۆ. نەخشەی ئەندازیاری پەسەندکراو یان پلانی ئامادە بۆ جێبەجێکردن نییە، و هیچ بانگەشەیەکی سەلامەتی پەیکەری یان گونجان لەگەڵ یاسای بیناسازی و مۆڵەت ناکات. پێش دروستکردن، دەبێت تەلارساز و ئەندازیارێکی شارەزا و مۆڵەتدار پێیدا بچنەوە و پەرەی پێبدەن.",
};

export const RULES_TEXT: Record<Locale, RulesText> = { en, ar, ckb };
export const TYPE_WORD: Record<Locale, Record<"residential" | "commercial", string>> = {
  en: { residential: "residential", commercial: "commercial" },
  ar: { residential: "سكني", commercial: "تجاري" },
  ckb: { residential: "نیشتەجێبوون", commercial: "بازرگانی" },
};
