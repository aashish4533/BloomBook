const DEFAULT_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Romance',
  'Biography',
  'History',
  'Self-Help',
  'Business',
  'Science',
  'Philosophy',
  'Classic Literature',
  'Other',
] as const;

/** Strip separators; keep digits and X (ISBN-10 check digit). */
export function normalizeIsbnInput(raw: string): string {
  return raw.replace(/[^0-9X]/gi, '').toUpperCase();
}

function mapRawCategory(raw: string, allowed: string[]): string {
  const r = raw.trim();
  if (!r) return 'Other';
  const lower = r.toLowerCase();
  const exact = allowed.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('fantasy')) return 'Fantasy';
  if (lower.includes('science fiction') || lower.includes('sci-fi')) return 'Science Fiction';
  if (lower.includes('mystery') || lower.includes('crime')) return 'Mystery';
  if (lower.includes('romance')) return 'Romance';
  if (lower.includes('biograph')) return 'Biography';
  if (lower.includes('histor')) return 'History';
  if (lower.includes('business') || lower.includes('econom')) return 'Business';
  if (lower.includes('self-help') || lower.includes('self help')) return 'Self-Help';
  if (lower.includes('philosoph')) return 'Philosophy';
  if (lower.includes('fiction') && !lower.includes('non-fiction') && !lower.includes('nonfiction')) return 'Fiction';
  if (lower.includes('non-fiction') || lower.includes('nonfiction')) return 'Non-Fiction';
  if (lower.includes('science') || lower.includes('physics') || lower.includes('biology')) return 'Science';
  return 'Other';
}

function mapLangCode(code?: string): string {
  if (!code) return 'English';
  const c = code.toLowerCase().slice(0, 2);
  const m: Record<string, string> = {
    en: 'English',
    ur: 'اردو',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    ar: 'Arabic',
    hi: 'Hindi',
  };
  return m[c] || code.toUpperCase();
}

type LookupFields = {
  bookName: string;
  author: string;
  publishedYear?: string;
  pages?: string;
  category?: string;
  language?: string;
  description?: string;
};

async function fetchFromOpenLibrary(cleanIsbn: string, categories: string[]): Promise<LookupFields | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(cleanIsbn)}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const entry = data[`ISBN:${cleanIsbn}`];
  if (!entry || !entry.title) return null;

  const authors = Array.isArray(entry.authors)
    ? entry.authors.map((a: { name?: string }) => a?.name).filter(Boolean).join(', ')
    : '';
  let publishedYear = '';
  if (entry.publish_date) {
    const m = String(entry.publish_date).match(/(19|20)\d{2}/);
    publishedYear = m ? m[0] : '';
  }
  const pages = entry.number_of_pages != null ? String(entry.number_of_pages) : '';
  let category = 'Other';
  if (Array.isArray(entry.subjects) && entry.subjects.length) {
    const sub = entry.subjects[0];
    const label = typeof sub === 'string' ? sub : sub?.name;
    if (label) category = mapRawCategory(String(label), categories);
  }
  let language = 'English';
  if (Array.isArray(entry.languages) && entry.languages.length) {
    const href = entry.languages[0]?.key || '';
    const code = href.split('/').pop() || '';
    if (code) language = mapLangCode(code.length >= 2 ? code.slice(0, 2) : code);
  }

  return {
    bookName: entry.title,
    author: authors,
    publishedYear,
    pages,
    category,
    language,
  };
}

async function fetchFromGoogleBooks(
  cleanIsbn: string,
  categories: string[]
): Promise<{ result: LookupFields | null; rateLimited: boolean }> {
  const apiKey = (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined)?.trim();
  const base = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(cleanIsbn)}`;
  const url = apiKey ? `${base}&key=${encodeURIComponent(apiKey)}` : base;
  const response = await fetch(url);
  if (response.status === 429) {
    return { result: null, rateLimited: true };
  }
  if (!response.ok) {
    return { result: null, rateLimited: false };
  }
  const data = await response.json();
  if (!data.totalItems || !data.items?.[0]) {
    return { result: null, rateLimited: false };
  }
  const bookInfo = data.items[0].volumeInfo;
  const authors = Array.isArray(bookInfo.authors) ? bookInfo.authors.join(', ') : '';
  let publishedYear = '';
  if (bookInfo.publishedDate) {
    const m = String(bookInfo.publishedDate).match(/(19|20)\d{2}/);
    publishedYear = m ? m[0] : bookInfo.publishedDate.split('-')[0] || '';
  }
  const pages = bookInfo.pageCount != null ? String(bookInfo.pageCount) : '';
  const category = bookInfo.categories?.[0]
    ? mapRawCategory(bookInfo.categories[0], categories)
    : 'Other';
  const language = mapLangCode(bookInfo.language);

  return {
    rateLimited: false,
    result: {
      bookName: bookInfo.title || '',
      author: authors,
      publishedYear,
      pages,
      language,
      category,
      description: typeof bookInfo.description === 'string' ? bookInfo.description : '',
    },
  };
}

export function validateIsbn(isbn: string): boolean {
  const clean = normalizeIsbnInput(isbn);

  if (clean.length === 10) {
    if (!/^[0-9]{9}[0-9X]$/i.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    const checkDigit = clean.charAt(9).toUpperCase();
    sum += checkDigit === 'X' ? 10 : parseInt(checkDigit, 10);
    return sum % 11 === 0;
  }

  if (clean.length === 13) {
    if (!/^[0-9]{13}$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean.charAt(i), 10) * (i % 2 === 0 ? 1 : 3);
    }
    let check = 10 - (sum % 10);
    if (check === 10) check = 0;
    return check === parseInt(clean.charAt(12), 10);
  }

  return false;
}

export type IsbnLookupOk = {
  ok: true;
  displayIsbn: string;
  title: string;
  author: string;
  description?: string;
};

export type IsbnLookupFail = { ok: false; error: string };

export type IsbnLookupResult = IsbnLookupOk | IsbnLookupFail;

/**
 * Resolve title, author, and optional description from ISBN (Open Library, then Google Books).
 */
export async function lookupBookMetadataByIsbn(isbnInput: string): Promise<IsbnLookupResult> {
  const isbnToLookup = isbnInput.trim();
  if (!isbnToLookup) {
    return { ok: false, error: 'Please enter an ISBN first.' };
  }
  if (!validateIsbn(isbnToLookup)) {
    return {
      ok: false,
      error: 'Invalid ISBN-10 or ISBN-13 (check digits). You can use dashes or spaces.',
    };
  }

  const cleanISBN = normalizeIsbnInput(isbnToLookup);
  const categories = [...DEFAULT_CATEGORIES];

  try {
    const ol = await fetchFromOpenLibrary(cleanISBN, categories);
    if (ol && ol.bookName) {
      return {
        ok: true,
        displayIsbn: isbnToLookup,
        title: ol.bookName,
        author: ol.author,
      };
    }

    const { result: googleHit, rateLimited } = await fetchFromGoogleBooks(cleanISBN, categories);
    if (googleHit && googleHit.bookName) {
      return {
        ok: true,
        displayIsbn: isbnToLookup,
        title: googleHit.bookName,
        author: googleHit.author,
        description: googleHit.description?.trim() || undefined,
      };
    }
    if (rateLimited) {
      return {
        ok: false,
        error:
          'Google Books is rate-limiting lookups right now. Try again in a minute, or enter details manually. (Tip: set VITE_GOOGLE_BOOKS_API_KEY for a higher quota.)',
      };
    }
    return { ok: false, error: 'No book found with this ISBN. Enter details manually.' };
  } catch {
    return { ok: false, error: 'Failed to look up this ISBN. Enter details manually.' };
  }
}