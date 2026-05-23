// Meal photo analyzer — client-side wrapper.
// Calls the Supabase Edge Function (analyze-meal) which uses OpenRouter
// with a vision model to identify food from photos.
// Falls back to mock if the edge function is unavailable.

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

// Mock meals for fallback when edge function is unavailable
const MOCK_MEALS: AnalyzedItem[][] = [
  [
    { name: "White rice", name_zh: "白饭", portion_label: "1 bowl", protein_g: 4, confidence: 0.92 },
    { name: "BBQ pork / char siu", name_zh: "叉烧", portion_label: "1 palm", protein_g: 25, confidence: 0.84 },
    { name: "Bok choy", name_zh: "白菜", portion_label: "1 cup", protein_g: 2, confidence: 0.78 },
  ],
  [
    { name: "Chicken breast", name_zh: "鸡胸肉", portion_label: "1 palm", protein_g: 30, confidence: 0.91 },
    { name: "Brown rice", name_zh: "糙米饭", portion_label: "1 bowl", protein_g: 5, confidence: 0.86 },
    { name: "Broccoli", name_zh: "西兰花", portion_label: "1 cup", protein_g: 3, confidence: 0.80 },
  ],
  [
    { name: "Eggs", name_zh: "鸡蛋", portion_label: "2 large", protein_g: 12, confidence: 0.95 },
    { name: "Bread, whole wheat", name_zh: "全麦面包", portion_label: "2 slices", protein_g: 7, confidence: 0.88 },
    { name: "Whole milk", name_zh: "全脂牛奶", portion_label: "1 cup", protein_g: 8, confidence: 0.82 },
  ],
  [
    { name: "Wonton noodle soup", name_zh: "云吞面", portion_label: "1 bowl", protein_g: 15, confidence: 0.89 },
  ],
  [
    { name: "Salmon", name_zh: "三文鱼", portion_label: "1 palm", protein_g: 32, confidence: 0.90 },
    { name: "Sweet potato", name_zh: "番薯", portion_label: "1 medium", protein_g: 2, confidence: 0.83 },
  ],
  [
    { name: "Hainan chicken rice", name_zh: "海南鸡饭", portion_label: "1 plate", protein_g: 30, confidence: 0.86 },
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
  const buf = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(buf);
  let fingerprint = "";
  for (let i = 0; i < Math.min(64, bytes.length); i += 4) {
    fingerprint += bytes[i].toString(16);
  }
  const idx = hashString(fingerprint + file.size) % MOCK_MEALS.length;
  const items = MOCK_MEALS[idx].map((x) => ({ ...x }));
  await new Promise((r) => setTimeout(r, 900));
  return {
    items,
    total_protein_g: sumProtein(items),
    mock: true,
    notice: "Mock analysis (AI service unavailable)",
  };
}

// Compress image before sending: resize to max 1024px, JPEG quality 0.8
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX_DIM = 1024;
      let { width, height } = img;

      // Scale down if larger than MAX_DIM
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG, quality 0.8
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || "";
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

// Public API: analyze a photo via Supabase Edge Function.
export async function analyzeMealPhoto(file: File): Promise<AnalysisResult> {
  const sb = (window as any).supabaseClient;
  if (!sb) return mockAnalysis(file);

  try {
    // Compress image before sending (prevents body size limit errors)
    const imageBase64 = await compressImage(file);

    const { data, error } = await sb.functions.invoke("analyze-meal", {
      body: { image: imageBase64 },
    });

    if (error) {
      console.warn("analyze-meal edge function error:", error);
      return mockAnalysis(file);
    }

    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      return {
        items: data.items,
        total_protein_g: data.total_protein_g ?? sumProtein(data.items),
        mock: false,
      };
    }

    return mockAnalysis(file);
  } catch (err) {
    console.warn("analyze-meal failed:", err);
    return mockAnalysis(file);
  }
}
