// Meal analyzer — client-side wrapper.
// Calls the Supabase Edge Function (analyze-meal) which uses OpenRouter
// to identify food from photos OR text descriptions.
// Falls back to mock if the edge function is unavailable.

export type AnalyzedItem = {
  name: string;
  name_zh: string;
  portion_label: string;
  protein_g: number;
  calories_kcal: number;
  fat_g: number;
  sugar_g: number;
  confidence: number;
};

export type AnalysisResult = {
  items: AnalyzedItem[];
  total_protein_g: number;
  total_calories_kcal: number;
  total_fat_g: number;
  total_sugar_g: number;
  mock: boolean;
  notice?: string;
  source?: "photo" | "text";
};

// Mock meals for fallback when edge function is unavailable
const MOCK_MEALS: AnalyzedItem[][] = [
  [
    { name: "White rice", name_zh: "白饭", portion_label: "1 bowl", protein_g: 4, calories_kcal: 200, fat_g: 0.5, sugar_g: 0, confidence: 0.92 },
    { name: "BBQ pork / char siu", name_zh: "叉烧", portion_label: "1 palm", protein_g: 25, calories_kcal: 320, fat_g: 15, sugar_g: 8, confidence: 0.84 },
    { name: "Bok choy", name_zh: "白菜", portion_label: "1 cup", protein_g: 2, calories_kcal: 15, fat_g: 0, sugar_g: 1, confidence: 0.78 },
  ],
  [
    { name: "Chicken breast", name_zh: "鸡胸肉", portion_label: "1 palm", protein_g: 30, calories_kcal: 165, fat_g: 3.5, sugar_g: 0, confidence: 0.91 },
    { name: "Brown rice", name_zh: "糙米饭", portion_label: "1 bowl", protein_g: 5, calories_kcal: 220, fat_g: 2, sugar_g: 0, confidence: 0.86 },
    { name: "Broccoli", name_zh: "西兰花", portion_label: "1 cup", protein_g: 3, calories_kcal: 30, fat_g: 0.5, sugar_g: 1.5, confidence: 0.80 },
  ],
  [
    { name: "Eggs", name_zh: "鸡蛋", portion_label: "2 large", protein_g: 12, calories_kcal: 140, fat_g: 10, sugar_g: 1, confidence: 0.95 },
    { name: "Bread, whole wheat", name_zh: "全麦面包", portion_label: "2 slices", protein_g: 7, calories_kcal: 160, fat_g: 2, sugar_g: 2, confidence: 0.88 },
    { name: "Whole milk", name_zh: "全脂牛奶", portion_label: "1 cup", protein_g: 8, calories_kcal: 150, fat_g: 8, sugar_g: 12, confidence: 0.82 },
  ],
  [
    { name: "Wonton noodle soup", name_zh: "云吞面", portion_label: "1 bowl", protein_g: 15, calories_kcal: 380, fat_g: 8, sugar_g: 2, confidence: 0.89 },
  ],
  [
    { name: "Salmon", name_zh: "三文鱼", portion_label: "1 palm", protein_g: 32, calories_kcal: 250, fat_g: 13, sugar_g: 0, confidence: 0.90 },
    { name: "Sweet potato", name_zh: "番薯", portion_label: "1 medium", protein_g: 2, calories_kcal: 100, fat_g: 0, sugar_g: 7, confidence: 0.83 },
  ],
  [
    { name: "Hainan chicken rice", name_zh: "海南鸡饭", portion_label: "1 plate", protein_g: 30, calories_kcal: 600, fat_g: 20, sugar_g: 2, confidence: 0.86 },
  ],
  [
    { name: "Pizza", name_zh: "薄饼", portion_label: "2 slices", protein_g: 24, calories_kcal: 570, fat_g: 22, sugar_g: 6, confidence: 0.92 },
  ],
];

function sumField(items: AnalyzedItem[], field: keyof AnalyzedItem): number {
  const t = items.reduce((acc, it) => acc + (Number(it[field]) || 0), 0);
  return Math.round(t * 10) / 10;
}

function mockFallback(): AnalysisResult {
  const idx = Math.floor(Math.random() * MOCK_MEALS.length);
  const items = MOCK_MEALS[idx].map((x) => ({ ...x }));
  return {
    items,
    total_protein_g: sumField(items, "protein_g"),
    total_calories_kcal: Math.round(items.reduce((s, i) => s + i.calories_kcal, 0)),
    total_fat_g: sumField(items, "fat_g"),
    total_sugar_g: sumField(items, "sugar_g"),
    mock: true,
    notice: "AI service unavailable — please try again or search manually",
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
  if (!sb) return mockFallback();

  try {
    const imageBase64 = await compressImage(file);

    const { data, error } = await sb.functions.invoke("analyze-meal", {
      body: { image: imageBase64 },
    });

    if (error) {
      console.warn("analyze-meal edge function error:", error);
      return mockFallback();
    }

    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      return {
        items: data.items,
        total_protein_g: data.total_protein_g ?? sumField(data.items, "protein_g"),
        total_calories_kcal: data.total_calories_kcal ?? 0,
        total_fat_g: data.total_fat_g ?? sumField(data.items, "fat_g"),
        total_sugar_g: data.total_sugar_g ?? sumField(data.items, "sugar_g"),
        mock: false,
        source: data.source || "photo",
      };
    }

    // Edge function returned empty items (model couldn't identify food)
    // Show a clear error, not a random mock meal
    console.warn("analyze-meal returned empty items:", data);
    return {
      items: [],
      total_protein_g: 0,
      total_calories_kcal: 0,
      total_fat_g: 0,
      total_sugar_g: 0,
      mock: true,
      notice: "Could not identify food from the photo. Try again or search manually.",
    };
  } catch (err) {
    console.warn("analyze-meal failed:", err);
    return mockFallback();
  }
}

// Public API: analyze a text description via Supabase Edge Function.
export async function analyzeMealText(description: string): Promise<AnalysisResult> {
  const sb = (window as any).supabaseClient;
  if (!sb) return mockFallback();

  try {
    const { data, error } = await sb.functions.invoke("analyze-meal", {
      body: { text: description },
    });

    if (error) {
      console.warn("analyze-meal text error:", error);
      return mockFallback();
    }

    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      return {
        items: data.items,
        total_protein_g: data.total_protein_g ?? sumField(data.items, "protein_g"),
        total_calories_kcal: data.total_calories_kcal ?? 0,
        total_fat_g: data.total_fat_g ?? sumField(data.items, "fat_g"),
        total_sugar_g: data.total_sugar_g ?? sumField(data.items, "sugar_g"),
        mock: false,
        source: "text",
      };
    }

    // Edge function returned empty items
    console.warn("analyze-meal text returned empty items:", data);
    return {
      items: [],
      total_protein_g: 0,
      total_calories_kcal: 0,
      total_fat_g: 0,
      total_sugar_g: 0,
      mock: true,
      notice: "Could not identify food items. Try rephrasing or search manually.",
    };
  } catch (err) {
    console.warn("analyze-meal text failed:", err);
    return mockFallback();
  }
}
