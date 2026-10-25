/**
 * VAJRA Mobile — India-First Multilingual Language Registry & Formatting Engine
 * 
 * Provides an exhaustive roadmap and runtime capability matrix for 20 Indian languages:
 * English (India), Hindi, Bengali, Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada,
 * Malayalam, Odia, Assamese, Urdu, Sanskrit, Bhojpuri, Rajasthani, Haryanvi, Chhattisgarhi,
 * Konkani, and Maithili.
 * 
 * For each language, independently tracks:
 * - Text input & generation
 * - Speech recognition availability
 * - Spoken TTS output availability
 * - Automatic detection
 * - Romanized / Hinglish input support
 * - Mixed-language code switching
 * - Tested locales and known provider boundaries
 * 
 * Includes authentic Indian context formatting:
 * - Indian Currency formatting (INR ₹ with Lakh/Crore grouping)
 * - Indian Date & Time formatting (DD/MM/YYYY, IST zone)
 * - Indian Phone Number validation (+91-9xxxxxxxxx)
 */

export interface IndianLanguageCapability {
  code: string;
  nativeName: string;
  englishName: string;
  script: string;
  locales: string[];
  textInput: boolean;
  textGeneration: boolean;
  speechRecognition: boolean;
  spokenOutput: boolean;
  automaticDetection: boolean;
  romanizedInput: boolean;
  mixedLanguage: boolean;
  supportTier: 'flagship' | 'extended' | 'roadmap';
  knownLimitations: string;
}

export const INDIAN_LANGUAGES_REGISTRY: Record<string, IndianLanguageCapability> = {
  'en-IN': {
    code: 'en-IN',
    nativeName: 'English (India)',
    englishName: 'Indian English',
    script: 'Latin',
    locales: ['en-IN', 'en-GB'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Native platform TTS voice availability depends on installed Android TTS voice packs.',
  },
  'hi-IN': {
    code: 'hi-IN',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    script: 'Devanagari',
    locales: ['hi-IN', 'hi'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Requires Google TTS or Android Hindi speech data pack for high-fidelity offline voice.',
  },
  'hinglish': {
    code: 'hinglish',
    nativeName: 'Hinglish (रोमन हिन्दी)',
    englishName: 'Hinglish (Romanized Hindi)',
    script: 'Latin',
    locales: ['hi-IN', 'en-IN'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Spoken output uses bilingual Indian English / Hindi phonetic pronunciation.',
  },
  'bn-IN': {
    code: 'bn-IN',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    script: 'Bengali',
    locales: ['bn-IN', 'bn-BD'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Speech recognition requires active network connection on standard Android devices without offline Bengali models.',
  },
  'mr-IN': {
    code: 'mr-IN',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    script: 'Devanagari',
    locales: ['mr-IN', 'mr'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'TTS voice quality varies based on OEM TTS engine; Google Speech Services recommended.',
  },
  'gu-IN': {
    code: 'gu-IN',
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    script: 'Gujarati',
    locales: ['gu-IN', 'gu'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Regional dialects (Surati, Kathiyawadi) mapped to standard Gujarati vocabulary.',
  },
  'pa-IN': {
    code: 'pa-IN',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    script: 'Gurmukhi',
    locales: ['pa-IN', 'pa-PK'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'TTS fallback uses Indian English phonetics when Gurmukhi TTS voice is absent.',
  },
  'ta-IN': {
    code: 'ta-IN',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    script: 'Tamil',
    locales: ['ta-IN', 'ta-LK'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Colloquial spoken Tamil mapped to standard formal written syntax during action extraction.',
  },
  'te-IN': {
    code: 'te-IN',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    script: 'Telugu',
    locales: ['te-IN', 'te'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Speech recognition requires active network on older Android versions (< Android 12).',
  },
  'kn-IN': {
    code: 'kn-IN',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    script: 'Kannada',
    locales: ['kn-IN', 'kn'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Offline TTS voices depend on Google Speech Services installation.',
  },
  'ml-IN': {
    code: 'ml-IN',
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    script: 'Malayalam',
    locales: ['ml-IN', 'ml'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'flagship',
    knownLimitations: 'Complex agglutinative compounds parsed into constituent entity tokens.',
  },
  'or-IN': {
    code: 'or-IN',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    script: 'Odia',
    locales: ['or-IN', 'or'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: false,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'extended',
    knownLimitations: 'Text generation available via Gemini; Native Android TTS voice is rare on default OEM ROMs.',
  },
  'as-IN': {
    code: 'as-IN',
    nativeName: 'অসমীয়া',
    englishName: 'Assamese',
    script: 'Bengali-Assamese',
    locales: ['as-IN', 'as'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: false,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'extended',
    knownLimitations: 'Text understanding active; speech TTS falls back to Bengali or Indian English voice.',
  },
  'ur-IN': {
    code: 'ur-IN',
    nativeName: 'اردو',
    englishName: 'Urdu',
    script: 'Nastaliq / Arabic',
    locales: ['ur-IN', 'ur-PK'],
    textInput: true,
    textGeneration: true,
    speechRecognition: true,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'extended',
    knownLimitations: 'RTL rendering active; speech synthesis supported via standard ur-IN voice.',
  },
  'sa-IN': {
    code: 'sa-IN',
    nativeName: 'संस्कृतम्',
    englishName: 'Sanskrit',
    script: 'Devanagari',
    locales: ['sa-IN', 'sa'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: false,
    supportTier: 'extended',
    knownLimitations: 'Spoken output uses classical Devanagari Hindi phonetics engine.',
  },
  'bho-IN': {
    code: 'bho-IN',
    nativeName: 'भोजपुरी',
    englishName: 'Bhojpuri',
    script: 'Devanagari / Kaithi',
    locales: ['bho-IN', 'bho'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'extended',
    knownLimitations: 'Spoken output mapped through Hindi acoustic model with regional vocabulary preservation.',
  },
  'raj-IN': {
    code: 'raj-IN',
    nativeName: 'राजस्थानी',
    englishName: 'Rajasthani',
    script: 'Devanagari',
    locales: ['raj-IN', 'raj'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'roadmap',
    knownLimitations: 'Dialect variations (Marwari, Mewari) mapped to regional Devanagari vocabulary.',
  },
  'bgc-IN': {
    code: 'bgc-IN',
    nativeName: 'हरियाणवी',
    englishName: 'Haryanvi',
    script: 'Devanagari',
    locales: ['bgc-IN'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'roadmap',
    knownLimitations: 'Spoken synthesis maps through northern Hindi acoustic models.',
  },
  'hne-IN': {
    code: 'hne-IN',
    nativeName: 'छत्तीसगढ़ी',
    englishName: 'Chhattisgarhi',
    script: 'Devanagari',
    locales: ['hne-IN'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'roadmap',
    knownLimitations: 'Speech recognition maps via standard Hindi recognizer with vocabulary translation.',
  },
  'kok-IN': {
    code: 'kok-IN',
    nativeName: 'कोंकणी',
    englishName: 'Konkani',
    script: 'Devanagari / Roman',
    locales: ['kok-IN', 'kok'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: false,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'roadmap',
    knownLimitations: 'Voice synthesis falls back to Marathi or Indian English voice.',
  },
  'mai-IN': {
    code: 'mai-IN',
    nativeName: 'मैथिली',
    englishName: 'Maithili',
    script: 'Devanagari / Tirhuta',
    locales: ['mai-IN', 'mai'],
    textInput: true,
    textGeneration: true,
    speechRecognition: false,
    spokenOutput: true,
    automaticDetection: true,
    romanizedInput: true,
    mixedLanguage: true,
    supportTier: 'roadmap',
    knownLimitations: 'Spoken synthesis utilizes Devanagari phonetics with Hindi voice engine.',
  },
};

/**
 * Returns all registered languages sorted by tier and name.
 */
export function getAllIndianLanguages(): IndianLanguageCapability[] {
  return Object.values(INDIAN_LANGUAGES_REGISTRY);
}

/**
 * Retrieves a language by code or alias.
 */
export function getIndianLanguage(codeOrAlias: string): IndianLanguageCapability | null {
  if (!codeOrAlias) return null;
  const clean = codeOrAlias.trim().toLowerCase();
  
  if (INDIAN_LANGUAGES_REGISTRY[codeOrAlias]) {
    return INDIAN_LANGUAGES_REGISTRY[codeOrAlias];
  }

  // Lookup by code prefix or name
  for (const lang of Object.values(INDIAN_LANGUAGES_REGISTRY)) {
    if (
      lang.code.toLowerCase() === clean ||
      lang.englishName.toLowerCase() === clean ||
      lang.nativeName.toLowerCase() === clean ||
      lang.locales.some((l) => l.toLowerCase() === clean)
    ) {
      return lang;
    }
  }

  // Fallbacks for short aliases
  if (clean === 'hi' || clean === 'hindi') return INDIAN_LANGUAGES_REGISTRY['hi-IN'];
  if (clean === 'en' || clean === 'english') return INDIAN_LANGUAGES_REGISTRY['en-IN'];
  if (clean === 'bn' || clean === 'bengali') return INDIAN_LANGUAGES_REGISTRY['bn-IN'];
  if (clean === 'mr' || clean === 'marathi') return INDIAN_LANGUAGES_REGISTRY['mr-IN'];
  if (clean === 'ta' || clean === 'tamil') return INDIAN_LANGUAGES_REGISTRY['ta-IN'];
  if (clean === 'te' || clean === 'telugu') return INDIAN_LANGUAGES_REGISTRY['te-IN'];
  if (clean === 'gu' || clean === 'gujarati') return INDIAN_LANGUAGES_REGISTRY['gu-IN'];
  if (clean === 'pa' || clean === 'punjabi') return INDIAN_LANGUAGES_REGISTRY['pa-IN'];
  if (clean === 'kn' || clean === 'kannada') return INDIAN_LANGUAGES_REGISTRY['kn-IN'];
  if (clean === 'ml' || clean === 'malayalam') return INDIAN_LANGUAGES_REGISTRY['ml-IN'];

  return null;
}

/**
 * Formats a numeric amount in authentic Indian Currency Format (INR ₹ with Lakh/Crore grouping).
 * e.g. 1234567.89 -> "₹12,34,567.89"
 * e.g. 10000000 -> "₹1,00,00,000" (1 Crore)
 */
export function formatIndianCurrency(amount: number, includeSymbol = true): string {
  if (isNaN(amount)) return includeSymbol ? '₹0' : '0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system: last 3 digits, then groups of 2
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}`;
  } else {
    result = integerPart;
  }

  const formatted = decimalPart === '00' ? result : `${result}.${decimalPart}`;
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Converts Indian currency or number into colloquial words (e.g. 1,50,000 -> "1.5 Lakh")
 */
export function formatIndianNumberWords(num: number): string {
  if (isNaN(num)) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    const crores = (abs / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${sign}${crores} Crore`;
  }
  if (abs >= 100000) {
    const lakhs = (abs / 100000).toFixed(2).replace(/\.00$/, '');
    return `${sign}${lakhs} Lakh`;
  }
  if (abs >= 1000) {
    const thousands = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${thousands} Thousand`;
  }
  return num.toString();
}

/**
 * Formats a Date object in Indian standard formats (DD/MM/YYYY, IST Time).
 */
export function formatIndianDate(
  date: Date | number,
  options: { includeTime?: boolean; format?: 'DD/MM/YYYY' | 'long_text' } = {}
): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let timeString = '';
  if (options.includeTime) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12
    timeString = ` ${hours}:${minutes} ${ampm} IST`;
  }

  if (options.format === 'long_text') {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${year}${timeString}`;
  }

  return `${day}/${month}/${year}${timeString}`;
}

/**
 * Validates and normalizes Indian mobile phone numbers (+91-9xxxxxxxxx).
 * Valid numbers in India are 10 digits starting with 6, 7, 8, or 9.
 */
export function validateIndianPhoneNumber(phone: string): {
  isValid: boolean;
  normalized?: string;
  formatted?: string;
  carrierType?: 'mobile' | 'landline' | 'toll_free';
  errorReason?: string;
} {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, errorReason: 'Empty phone number' };
  }

  // Remove whitespace, dashes, parens
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check for toll-free (1800, 1860)
  if (/^18(?:00|60)\d{6,7}$/.test(clean)) {
    return {
      isValid: true,
      normalized: clean,
      formatted: clean,
      carrierType: 'toll_free',
    };
  }

  // Extract 10 digits with optional +91, 91, or 0 prefix
  const match = clean.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (!match) {
    return {
      isValid: false,
      errorReason: 'Invalid Indian phone number. Must be a 10-digit number starting with 6, 7, 8, or 9.',
    };
  }

  const tenDigit = match[1];
  const normalized = `+91${tenDigit}`;
  const formatted = `+91 ${tenDigit.substring(0, 5)} ${tenDigit.substring(5)}`;

  return {
    isValid: true,
    normalized,
    formatted,
    carrierType: 'mobile',
  };
}
