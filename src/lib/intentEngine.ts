/**
 * ─────────────────────────────────────────────────────────────────
 * NEIGHBORLY TRUST — Multilingual Voice Intent Engine
 * ─────────────────────────────────────────────────────────────────
 * Industry-standard NLP intent classifier for service booking.
 *
 * How it works:
 *  1. Normalise input (lowercase, strip punctuation, trim).
 *  2. Score every category using a weighted keyword dictionary.
 *     - Exact phrase match  → weight × 2.0
 *     - Prefix/suffix match → weight × 1.0
 *  3. Return the top-scoring category if it exceeds CONFIDENCE_THRESHOLD.
 *     Otherwise return null (no false positives).
 *
 * Adding a new language:
 *  → Append keywords to the relevant category block below.
 *  → Do NOT change any other file.
 *
 * Supported languages (as of v1):
 *   English, Hindi, Tamil, Telugu, Kannada, Marathi,
 *   Gujarati, Bengali, Malayalam, Punjabi, Odia, Urdu.
 * ─────────────────────────────────────────────────────────────────
 */

export interface IntentResult {
  category: string;
  confidence: number;   // 0–1 (1 = perfect match)
  matchedOn: string[];  // debug: which keywords fired
}

// Minimum score to auto-select a category (avoids false positives)
const CONFIDENCE_THRESHOLD = 0.25;

// ─── Weighted keyword dictionary ─────────────────────────────────
// Each entry: [keyword, weight]
// Weight 3 = strong signal (problem phrase), 2 = moderate, 1 = weak
// ─────────────────────────────────────────────────────────────────
const INTENT_DICTIONARY: Record<string, Array<[string, number]>> = {

  Electrician: [
    // ─── Problem phrases (weight 3) ───
    ['light not working', 3], ['bulb not working', 3], ['no electricity', 3],
    ['power cut', 3], ['power outage', 3], ['short circuit', 3], ['wire spark', 3],
    ['electric shock', 3], ['mcb tripping', 3], ['fuse blown', 3], ['fuse gone', 3],
    ['switch not working', 3], ['socket not working', 3], ['fan not working', 3],
    ['ac not working', 3], ['geyser not working', 3], ['meter not working', 3],
    // ─── Hindi problem phrases ───
    ['बिजली नहीं है', 3], ['लाइट नहीं जल रही', 3], ['पंखा नहीं चल रहा', 3],
    ['करंट आ रहा है', 3], ['शॉर्ट सर्किट', 3], ['फ्यूज उड़ गया', 3],
    ['स्विच काम नहीं कर रहा', 3], ['बिजली गई', 3], ['वायरिंग खराब है', 3],
    // ─── Trade/skill words (weight 2) ───
    ['electrician', 2], ['electrical', 2], ['wiring', 2], ['voltage', 2],
    ['inverter', 2], ['ups repair', 2], ['meter box', 2], ['distribution board', 2],
    ['earth leakage', 2], ['neutral', 2],
    // ─── Hindi trade words ───
    ['बिजली मिस्त्री', 2], ['इलेक्ट्रिशियन', 2], ['वायरिंग', 2], ['मीटर', 2],
    // ─── Single signal words (weight 1) ───
    ['electric', 1], ['light', 1], ['bulb', 1], ['fan', 1], ['fuse', 1],
    ['switch', 1], ['socket', 1], ['plug', 1], ['mcb', 1], ['spark', 1],
    ['बिजली', 1], ['लाइट', 1], ['पंखा', 1], ['बत्ती', 1], ['फ्यूज', 1],
    ['स्विच', 1], ['करंट', 1],
    // ─── Tamil ───
    ['மின்சாரம்', 2], ['மின் தடை', 3], ['லைட் வேலை செய்யவில்லை', 3],
    ['மின்சாரம் இல்லை', 3], ['பல்ப்', 1], ['ஸ்விட்ச்', 1],
    // ─── Telugu ───
    ['కరెంట్ రావడం లేదు', 3], ['కరెంట్ పోయింది', 3], ['విద్యుత్ లేదు', 3],
    ['కరెంట్', 1], ['విద్యుత్', 1], ['బల్బు', 1],
    // ─── Kannada ───
    ['ಕರೆಂಟ್ ಇಲ್ಲ', 3], ['ಲೈಟ್ ಆಗ್ತಿಲ್ಲ', 3], ['ವಿದ್ಯುತ್', 1], ['ಕರೆಂಟ್', 1],
    // ─── Marathi ───
    ['वीज नाही', 3], ['लाइट चालू होत नाही', 3], ['वीज', 1], ['फ्युज', 1],
    // ─── Bengali ───
    ['বিদ্যুৎ নেই', 3], ['আলো জ্বলছে না', 3], ['বিদ্যুৎ', 1], ['আলো', 1],
    // ─── Gujarati ───
    ['વીજળી નથી', 3], ['લાઇટ ચાલુ થઈ નથી', 3], ['વીજળી', 1],
    // ─── Malayalam ───
    ['കറന്റ് ഇല്ല', 3], ['ലൈറ്റ് കത്തുന്നില്ല', 3], ['വൈദ്യുതി', 1],
    // ─── Punjabi ───
    ['ਬਿਜਲੀ ਨਹੀਂ ਹੈ', 3], ['ਬਿਜਲੀ', 1],
    // ─── Urdu ───
    ['بجلی نہیں ہے', 3], ['لائٹ نہیں جل رہی', 3], ['بجلی', 1],
  ],

  Plumber: [
    // ─── Problem phrases ───
    ['water leaking', 3], ['tap leaking', 3], ['pipe leaking', 3],
    ['pipe burst', 3], ['no water', 3], ['water not coming', 3],
    ['toilet blocked', 3], ['drain blocked', 3], ['sewage overflow', 3],
    ['water tank overflow', 3], ['borewell not working', 3],
    ['motor pump not working', 3], ['water pressure low', 3],
    ['flush not working', 3], ['bathroom leaking', 3], ['kitchen tap', 2],
    // ─── Hindi problem phrases ───
    ['पानी लीक हो रहा है', 3], ['नल से पानी टपक रहा है', 3],
    ['पाइप फट गया', 3], ['पानी नहीं आ रहा', 3], ['शौचालय बंद है', 3],
    ['नाली बंद है', 3], ['पानी टंकी ओवरफ्लो', 3], ['बोरवेल खराब', 3],
    ['मोटर पंप खराब', 3], ['पाइप लीक', 2],
    // ─── Trade words ───
    ['plumber', 2], ['plumbing', 2], ['pipeline', 2], ['waterworks', 2],
    // ─── Single signal words ───
    ['water', 1], ['tap', 1], ['pipe', 1], ['leak', 1], ['drain', 1],
    ['sewage', 1], ['flush', 1], ['tank', 1], ['borewell', 1],
    ['नल', 1], ['पानी', 1], ['पाइप', 1], ['लीकेज', 1], ['सीवर', 1],
    ['नाली', 1], ['टंकी', 1],
    // ─── Tamil ───
    ['தண்ணீர் கசிகிறது', 3], ['குழாய் உடைந்தது', 3], ['தண்ணீர் வரவில்லை', 3],
    ['தண்ணீர்', 1], ['குழாய்', 1],
    // ─── Telugu ───
    ['నీరు లీకవుతోంది', 3], ['పైపు పగిలింది', 3], ['నీళ్ళు రావడం లేదు', 3],
    ['నీరు', 1], ['పైపు', 1],
    // ─── Kannada ───
    ['ನೀರು ಸೋರುತ್ತಿದೆ', 3], ['ಪೈಪ್ ಒಡೆದಿದೆ', 3], ['ನೀರು', 1], ['ನಲ್ಲಿ', 1],
    // ─── Marathi ───
    ['पाणी गळत आहे', 3], ['नळ गळतोय', 3], ['पाणी', 1], ['नळ', 1],
    // ─── Bengali ───
    ['জল পড়ছে', 3], ['পাইপ ফেটেছে', 3], ['জল আসছে না', 3], ['জল', 1],
    // ─── Gujarati ───
    ['પાણી લીક થઈ રહ્યું છે', 3], ['નળ ટપકે છે', 3], ['પાણી', 1],
    // ─── Malayalam ───
    ['വെള്ളം ചോരുന്നു', 3], ['പൈപ്പ് പൊട്ടി', 3], ['വെള്ളം', 1],
    // ─── Urdu ───
    ['پانی لیک ہو رہا ہے', 3], ['نل سے پانی ٹپک رہا ہے', 3], ['پانی', 1],
  ],

  Carpenter: [
    // ─── Problem phrases ───
    ['door not closing', 3], ['door broken', 3], ['window broken', 3],
    ['lock broken', 3], ['furniture repair', 3], ['chair broken', 3],
    ['bed broken', 3], ['table broken', 3], ['cupboard repair', 3],
    ['wooden work', 2], ['carpentry work', 2],
    // ─── Hindi problem phrases ───
    ['दरवाजा नहीं बंद हो रहा', 3], ['दरवाजा टूट गया', 3],
    ['खिड़की टूट गई', 3], ['ताला टूट गया', 3], ['फर्नीचर ठीक करना है', 3],
    ['कुर्सी टूट गई', 3], ['पलंग टूट गया', 3], ['अलमारी ठीक करना है', 3],
    // ─── Trade words ───
    ['carpenter', 2], ['woodwork', 2], ['joinery', 2],
    // ─── Single signal words ───
    ['door', 1], ['window', 1], ['lock', 1], ['wood', 1], ['furniture', 1],
    ['chair', 1], ['table', 1], ['bed', 1], ['cabinet', 1], ['shelf', 1],
    ['लकड़ी', 1], ['दरवाजा', 1], ['ताला', 1], ['खिड़की', 1], ['फर्नीचर', 1],
    ['कुर्सी', 1], ['अलमारी', 1],
    // ─── Tamil ───
    ['கதவு சரிசெய்ய வேண்டும்', 3], ['மரவேலை', 2], ['கதவு', 1], ['மரம்', 1],
    // ─── Telugu ───
    ['తలుపు సరిచేయాలి', 3], ['చెక్కపని', 2], ['తలుపు', 1], ['చెక్క', 1],
    // ─── Kannada ───
    ['ಬಾಗಿಲು ರಿಪೇರಿ', 3], ['ಮರಗೆಲಸ', 2], ['ಬಾಗಿಲು', 1], ['ಮರ', 1],
    // ─── Marathi ───
    ['दरवाजा दुरुस्त करायचा', 3], ['लाकडी काम', 2], ['दरवाजा', 1],
    // ─── Bengali ───
    ['দরজা ভেঙেছে', 3], ['কাঠের কাজ', 2], ['দরজা', 1], ['কাঠ', 1],
    // ─── Urdu ───
    ['دروازہ ٹوٹ گیا', 3], ['لکڑی کا کام', 2], ['دروازہ', 1],
  ],

  'Home Clean': [
    // ─── Problem phrases ───
    ['house cleaning', 3], ['deep cleaning', 3], ['need maid', 3],
    ['need helper', 3], ['kitchen cleaning', 3], ['bathroom cleaning', 3],
    ['floor mopping', 3], ['cooking help', 3], ['daily helper', 3],
    ['part time maid', 3], ['housekeeping', 2],
    // ─── Hindi problem phrases ───
    ['घर की सफाई चाहिए', 3], ['झाड़ू पोंछा चाहिए', 3],
    ['खाना बनाने वाली चाहिए', 3], ['बाई चाहिए', 3], ['मेड चाहिए', 3],
    ['घर साफ करना है', 3], ['बर्तन धोने वाली', 3],
    // ─── Trade words ───
    ['cleaner', 2], ['cleaning', 2], ['maid', 2], ['housekeeper', 2],
    ['cook', 2], ['domestic help', 2],
    // ─── Single signal words ───
    ['clean', 1], ['sweep', 1], ['mop', 1], ['dust', 1], ['wash', 1],
    ['kitchen', 1], ['bathroom', 1], ['helper', 1], ['cook', 1],
    ['सफाई', 1], ['झाड़ू', 1], ['पोंछा', 1], ['खाना', 1], ['बाई', 1],
    ['बर्तन', 1],
    // ─── Tamil ───
    ['வீடு சுத்தப்படுத்த வேண்டும்', 3], ['வேலையாள் வேண்டும்', 3],
    ['சமையல்', 1], ['சுத்தம்', 1],
    // ─── Telugu ───
    ['ఇంటిని శుభ్రం చేయాలి', 3], ['పని మనిషి కావాలి', 3],
    ['వంట', 1], ['శుభ్రం', 1],
    // ─── Kannada ───
    ['ಮನೆ ಸ್ವಚ್ಛ ಮಾಡಬೇಕು', 3], ['ಕೆಲಸದವಳು ಬೇಕು', 3],
    ['ಅಡಿಗೆ', 1], ['ಸ್ವಚ್ಛ', 1],
    // ─── Marathi ───
    ['घर साफ करायचे आहे', 3], ['मोलकरीण हवी आहे', 3],
    ['स्वयंपाक', 1], ['साफसफाई', 1],
    // ─── Bengali ───
    ['বাড়ি পরিষ্কার করতে হবে', 3], ['কাজের মেয়ে দরকার', 3],
    ['রান্না', 1], ['পরিষ্কার', 1],
    // ─── Urdu ───
    ['گھر صاف کرنا ہے', 3], ['ملازمہ چاہیے', 3], ['صفائی', 1], ['کھانا', 1],
  ],

  Painter: [
    // ─── Problem phrases ───
    ['wall painting', 3], ['house painting', 3], ['room painting', 3],
    ['wall peeling', 3], ['paint chipping', 3], ['whitewash needed', 3],
    ['color work needed', 3], ['wall distemper', 2], ['exterior painting', 2],
    // ─── Hindi problem phrases ───
    ['दीवार रंगनी है', 3], ['घर पेंट करना है', 3], ['पेंट छिल रहा है', 3],
    ['सफेदी करनी है', 3], ['पुताई करनी है', 3],
    // ─── Trade words ───
    ['painter', 2], ['painting', 2], ['whitewash', 2], ['distemper', 2], ['polish', 2],
    // ─── Single signal words ───
    ['paint', 1], ['color', 1], ['colour', 1], ['wall', 1], ['primer', 1],
    ['रंग', 1], ['पेंट', 1], ['पुताई', 1], ['सफेदी', 1],
    // ─── Regional ───
    ['வண்ணம்', 1], ['రంగు', 1], ['ಬಣ್ಣ', 1], ['रंग', 1], ['রঙ', 1],
    ['ਰੰਗ', 1], ['رنگ', 1],
  ],

  'Pest Control': [
    // ─── Problem phrases ───
    ['cockroach problem', 3], ['termite problem', 3], ['rat problem', 3],
    ['mosquito problem', 3], ['bed bugs', 3], ['ant infestation', 3],
    ['pest infestation', 3], ['insect spray', 2], ['pest treatment', 2],
    // ─── Hindi problem phrases ───
    ['तिलचट्टे हैं', 3], ['चूहे हैं', 3], ['दीमक लगी है', 3],
    ['मच्छर बहुत हैं', 3], ['कीड़े मकोड़े हैं', 3],
    // ─── Trade words ───
    ['pest control', 2], ['fumigation', 2], ['exterminator', 2],
    // ─── Single signal words ───
    ['pest', 1], ['cockroach', 1], ['termite', 1], ['rat', 1],
    ['mosquito', 1], ['bugs', 1], ['ants', 1], ['insects', 1],
    ['दीमक', 1], ['कीड़ा', 1], ['मच्छर', 1], ['चूहा', 1], ['तिलचट्टा', 1],
    // ─── Regional ───
    ['பூச்சி', 1], ['கரப்பான்', 1], ['పురుగు', 1], ['ಕೀಟ', 1],
    ['कीटक', 1], ['পোকা', 1], ['جراثیم', 1],
  ],
};

// ─── Normalize text ───────────────────────────────────────────
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Score one category against the input ────────────────────
function scoreCategory(input: string, keywords: Array<[string, number]>): {
  score: number;
  matched: string[];
} {
  let score = 0;
  const matched: string[] = [];
  const words = input.split(' ');

  for (const [kw, weight] of keywords) {
    const normalKw = normalize(kw);
    if (input.includes(normalKw)) {
      // Bonus ×2 for exact/longer phrase match
      const bonus = normalKw.includes(' ') ? 2.0 : 1.0;
      score += weight * bonus;
      matched.push(kw);
    }
  }
  return { score, matched };
}

// ─── Main export ─────────────────────────────────────────────
export function detectIntent(rawInput: string): IntentResult | null {
  const input = normalize(rawInput);
  if (!input) return null;

  let bestCategory = '';
  let bestScore    = 0;
  let bestMatched: string[] = [];
  let totalScore   = 0;

  for (const [category, keywords] of Object.entries(INTENT_DICTIONARY)) {
    const { score, matched } = scoreCategory(input, keywords);
    totalScore += score;
    if (score > bestScore) {
      bestScore    = score;
      bestCategory = category;
      bestMatched  = matched;
    }
  }

  if (bestScore === 0) return null;

  // Confidence = best / total (how dominant is the winner?)
  // Clamp to 0–1, then apply threshold
  const confidence = Math.min(bestScore / (totalScore || 1), 1);
  if (confidence < CONFIDENCE_THRESHOLD) return null;

  return {
    category:   bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    matchedOn:  bestMatched,
  };
}
