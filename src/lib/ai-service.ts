// AI 레시피 생성 서비스
// 무료 옵션: Hugging Face Inference API 또는 로컬 모델
// 유료 옵션: OpenAI GPT, Anthropic Claude 등

export interface AIRecipeRequest {
  ingredients: string[];
  difficulty?: "easy" | "medium" | "hard";
  servings?: number;
  cuisine?: string;
  dietary?: string[];
}

export interface AIRecipeResponse {
  name: string;
  ingredients: Array<{ name: string; quantity: string; isAvailable: boolean }>;
  instructions: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  tags: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tips?: string[];
}

// Perplexity AI 서비스
export const perplexityService = {
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("Perplexity API key not found");
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "당신은 전문 요리사입니다. 주어진 식재료로 맛있고 실용적인 레시피를 만들어주세요. 한국어로 답변해주세요.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const recipeText = data.choices[0].message.content;

      return this.parseRecipeResponse(recipeText, request);
    } catch (error) {
      console.error("Perplexity AI error:", error);
      throw new Error("레시피 생성에 실패했습니다. 다시 시도해주세요.");
    }
  },

  buildPrompt(request: AIRecipeRequest): string {
    const { ingredients, difficulty = "medium", servings = 2, cuisine, dietary } = request;

    let prompt = `다음 식재료로 만들 수 있는 레시피를 알려주세요:\n`;
    prompt += `주요 재료: ${ingredients.join(", ")}\n`;
    prompt += `난이도: ${difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}\n`;
    prompt += `인분: ${servings}인분\n`;

    if (cuisine) {
      prompt += `요리 종류: ${cuisine}\n`;
    }

    if (dietary && dietary.length > 0) {
      prompt += `식이 제한: ${dietary.join(", ")}\n`;
    }

    prompt += `\n다음 JSON 형식으로 답변해주세요:
{
  "name": "레시피명",
  "ingredients": [
    {"name": "재료명", "quantity": "수량", "isAvailable": true/false}
  ],
  "instructions": ["조리 단계 1", "조리 단계 2", ...],
  "cookingTime": 조리시간(분),
  "difficulty": "easy/medium/hard",
  "servings": 인분수,
  "tags": ["태그1", "태그2", ...],
  "nutritionInfo": {
    "calories": 칼로리,
    "protein": 단백질(g),
    "carbs": 탄수화물(g),
    "fat": 지방(g)
  },
  "tips": ["요리 팁 1", "요리 팁 2", ...]
}`;

    return prompt;
  },

  parseRecipeResponse(recipeText: string, request: AIRecipeRequest): AIRecipeResponse {
    try {
      // JSON 부분 추출
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const recipe = JSON.parse(jsonMatch[0]);

      // 기본값 설정
      return {
        name: recipe.name || "AI 생성 레시피",
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        cookingTime: recipe.cookingTime || 30,
        difficulty: recipe.difficulty || "medium",
        servings: recipe.servings || 2,
        tags: recipe.tags || ["AI생성"],
        nutritionInfo: recipe.nutritionInfo,
        tips: recipe.tips || [],
      };
    } catch (error) {
      console.error("Recipe parsing error:", error);
      // 파싱 실패 시 기본 레시피 반환
      return {
        name: "AI 생성 레시피",
        ingredients: request.ingredients.map((name) => ({ name, quantity: "적당량", isAvailable: true })),
        instructions: ["재료를 준비합니다.", "조리합니다.", "완성!"],
        cookingTime: 30,
        difficulty: "medium",
        servings: 2,
        tags: ["AI생성"],
      };
    }
  },

  // 실시간 정보 조회
  async getSeasonalIngredients(): Promise<string[]> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "user",
              content: "현재 계절에 맞는 신선한 식재료 10가지를 알려주세요. JSON 배열 형태로 답변해주세요.",
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch seasonal ingredients");
      }

      const data = await response.json();
      const ingredientsText = data.choices[0].message.content;

      // JSON 배열 추출
      const jsonMatch = ingredientsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error("Error fetching seasonal ingredients:", error);
      return [];
    }
  },

  // 요리 팁 조회
  async getCookingTips(ingredient: string): Promise<string[]> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "user",
              content: `${ingredient}를 조리할 때 유용한 팁 5가지를 알려주세요. JSON 배열 형태로 답변해주세요.`,
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cooking tips");
      }

      const data = await response.json();
      const tipsText = data.choices[0].message.content;

      // JSON 배열 추출
      const jsonMatch = tipsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error("Error fetching cooking tips:", error);
      return [];
    }
  },
};

// 기존 OpenAI 서비스 (백업용)
export const openAIService = {
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key not found");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "당신은 전문 요리사입니다. 주어진 식재료로 맛있고 실용적인 레시피를 만들어주세요.",
            },
            {
              role: "user",
              content: `다음 식재료로 레시피를 만들어주세요: ${request.ingredients.join(", ")}`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const recipeText = data.choices[0].message.content;

      // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
      return {
        name: "AI 생성 레시피",
        ingredients: request.ingredients.map((name) => ({ name, quantity: "적당량", isAvailable: true })),
        instructions: recipeText.split("\n").filter((line: string) => line.trim()),
        cookingTime: 30,
        difficulty: "medium",
        servings: 2,
        tags: ["AI생성"],
      };
    } catch (error) {
      console.error("OpenAI error:", error);
      throw new Error("레시피 생성에 실패했습니다.");
    }
  },
};

// 통합 AI 서비스 (Perplexity 우선, 실패 시 OpenAI)
export const aiService = {
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    try {
      // Perplexity AI 시도
      return await perplexityService.generateRecipe(request);
    } catch (error) {
      console.log("Perplexity failed, trying OpenAI...");
      try {
        // OpenAI 백업
        return await openAIService.generateRecipe(request);
      } catch (openAIError) {
        console.error("All AI services failed:", error, openAIError);
        throw new Error("AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  },

  async getSeasonalIngredients(): Promise<string[]> {
    return await perplexityService.getSeasonalIngredients();
  },

  async getCookingTips(ingredient: string): Promise<string[]> {
    return await perplexityService.getCookingTips(ingredient);
  },
};
