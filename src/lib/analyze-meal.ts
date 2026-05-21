// Meal photo analyzer — client-side wrapper.
//
// PRODUCTION PATH:
//   Astro is in static-output mode (no SSR adapter), so we can't host a POST
//   endpoint here without adding the Vercel/Node adapter. The real OpenAI
//   integration belongs in a Supabase Edge Function:
//     supabase/functions/analyze-meal/index.ts
//   It would receive base64 image + auth JWT, call GPT-4o-mini vision, and
//   return the same shape as MOCK_ANALYSIS below. Set OPENAI_API_KEY as a
//   Supabase secret.
//
// FOR NOW: this returns a deterministic-ish mock so the UI is fully testable.
// The mock is clearly labeled with `mock: true` on every result so Marco can
// see it in the UI.

export type AnalyzedItem = {
  name: string;
  name_zh: string;
  portion_label: string;
  protein_g: number;
  confidence: number;
};

export type AnalysisResult = {
  items: AnalyzedItem[];
  total_protein_g: number;
  mock: boolean;
  notice?: string;
};

// A small curated pool of plausible meal "guesses" the mock cycles through.
// Each set is a realistic-looking meal a kid in HK might eat. We rotate based
// on a hash of the photo bytes so the same photo returns the same result in
// the same session — feels more like real AI behaviour during testing.
const MOCK_MEALS: AnalyzedItem[][] = [
  [
    { name: "White rice", name_zh: "白饭", portion_label: "1 bowl", protein_g: 4, confidence: 0.92 },
    { name: "BBQ pork / char siu", name_zh: "叉烧", portion_label: "1 palm", protein_g: 25, confidence: 0.84 },
    { name: "Bok choy", name_zh: "白菜", portion_label: "1 cup", protein_g: 2, confidence: 0.78 },
  ],
  [
    { name: "Eggs", name_zh: "鸡蛋", portion_label: "2 large", protein_g: 12, confidence: 0.95 },
    { name: "Bread, whole wheat", name_zh: "全麦面包", portion_label: "2 slices", protein_g: 7, confidence: 0.88 },
    { name: "Whole milk", name_zh: "全脂牛奶", portion_label: "1 cup", protein_g: 8, confidence: 0.82 },
  ],
  [
    { name: "Chicken breast", name_zh: "鸡胸肉", portion_label: "1 palm", protein_g: 30, confidence: 0.91 },
    { name: "Brown rice", name_zh: "糙米饭", portion_label: "1 bowl", protein_g: 5, confidence: 0.86 },
    { name: "Broccoli", name_zh: "西兰花", portion_label: "1 cup", protein_g: 3, confidence: 0.80 },
  ],
  [
    { name: "Wonton noodle soup", name_zh: "云吞面", portion_label: "1 bowl", protein_g: 15, confidence: 0.89 },
  ],
  [
    { name: "Salmon", name_zh: "三文鱼", portion_label: "1 palm", protein_g: 32, confidence: 0.90 },
    { name: "Sweet potato", name_zh: "番薯", portion_label: "1 medium", protein_g: 2, confidence: 0.83 },
    { name: "Mixed vegetables", name_zh: "杂菜", portion_label: "1 cup", protein_g: 3, confidence: 0.79 },
  ],
  [
    { name: "Beef brisket noodle soup", name_zh: "牛腩面", portion_label: "1 bowl", protein_g: 25, confidence: 0.88 },
  ],
  [
    { name: "Greek yogurt", name_zh: "希腊酸奶", portion_label: "1 cup", protein_g: 15, confidence: 0.93 },
    { name: "Blueberries", name_zh: "蓝莓", portion_label: "1 cup", protein_g: 1, confidence: 0.87 },
    { name: "Banana", name_zh: "香蕉", portion_label: "1 medium", protein_g: 1, confidence: 0.90 },
  ],
  [
    { name: "Hainan chicken rice", name_zh: "海南鸡饭", portion_label: "1 plate", protein_g: 30, confidence: 0.86 },
  ],
  [
    { name: "Tofu, firm", name_zh: "老豆腐", portion_label: "1 block", protein_g: 20, confidence: 0.85 },
    { name: "White rice", name_zh: "白饭", portion_label: "1 bowl", protein_g: 4, confidence: 0.90 },
    { name: "Chinese broccoli / gai lan", name_zh: "芥兰", portion_label: "1 cup", protein_g: 3, confidence: 0.80 },
  ],
  [
    { name: "Pizza", name_zh: "薄饼", portion_label: "2 slices", protein_g: 24, confidence: 0.92 },
  ],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function sumProtein(items: AnalyzedItem[]): number {
  return Math.round(items.reduce((acc, it) => acc + it.protein_g, 0) * 10) / 10;
}

async function mockAnalysis(file: File): Promise<AnalysisResult> {
  // Read a small chunk of the file to seed the mock selection — same photo
  // returns same items, different photos return different items.
  const buf = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(buf);
  let fingerprint = "";
  for (let i = 0; i < Math.min(64, bytes.length); i += 4) {
    fingerprint += bytes[i].toString(16);
  }
  const idx = hashString(fingerprint + file.size) % MOCK_MEALS.length;
  const items = MOCK_MEALS[idx].map((x) => ({ ...x }));

  // Simulate network latency so the UI loading state is visible.
  await new Promise((r) => setTimeout(r, 900));

  return {
    items,
    total_protein_g: sumProtein(items),
    mock: true,
    notice: "Mock analysis (no AI key configured)",
  };
}

// Public API: analyze a photo. Tries POST /api/analyze-meal first; if that
// endpoint isn't wired up (no API key, no server adapter) it falls back to
// the labelled mock so the UI stays usable end-to-end.
export async function analyzeMealPhoto(file: File): Promise<AnalysisResult> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/analyze-meal", { method: "POST", body: form });
    if (res.ok) {
      const json = (await res.json()) as { items?: AnalyzedItem[] };
      if (Array.isArray(json.items) && json.items.length > 0) {
        return {
          items: json.items,
          total_protein_g: sumProtein(json.items),
          mock: false,
        };
      }
    }
  } catch {
    // Network or parse error — fall through to mock.
  }
  return mockAnalysis(file);
}
