// AI 레시피 생성 서비스
// Perplexity AI를 사용한 레시피 생성

import { recipeService } from "./database";

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
  image?: string;
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
  // 중복 레시피 검사
  async checkDuplicateRecipe(recipeName: string, ingredients: string[]): Promise<boolean> {
    try {
      const existingRecipes = await recipeService.getAllRecipes();

      // 레시피 이름 비교 (유사도 검사)
      const normalizedRecipeName = this.normalizeRecipeName(recipeName);

      for (const recipe of existingRecipes) {
        const normalizedExistingName = this.normalizeRecipeName(recipe.name);

        // 이름이 매우 유사한 경우 중복으로 판단
        if (this.isSimilarRecipeName(normalizedRecipeName, normalizedExistingName)) {
          return true;
        }

        // 주요 재료가 동일한 경우도 중복으로 판단
        const existingIngredients = recipe.ingredients.map((ing) => ing.name?.toLowerCase() || "").filter(Boolean);
        const newIngredients = ingredients.map((ing) => ing.toLowerCase());

        if (this.hasSimilarIngredients(existingIngredients, newIngredients)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("중복 검사 중 오류:", error);
      return false; // 오류 발생 시 중복이 아닌 것으로 처리
    }
  },

  // 레시피 이름 정규화
  normalizeRecipeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w가-힣]/g, "") // 특수문자 제거
      .replace(/\s+/g, ""); // 공백 제거
  },

  // 레시피 이름 유사도 검사
  isSimilarRecipeName(name1: string, name2: string): boolean {
    // 완전 일치
    if (name1 === name2) return true;

    // 한쪽이 다른 쪽에 포함되는 경우
    if (name1.includes(name2) || name2.includes(name1)) return true;

    // 레벤슈타인 거리 계산 (간단한 버전)
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    const similarity = 1 - distance / maxLength;

    return similarity > 0.8; // 80% 이상 유사하면 중복으로 판단
  },

  // 레벤슈타인 거리 계산
  levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }

    return matrix[str2.length][str1.length];
  },

  // 재료 유사도 검사
  hasSimilarIngredients(ingredients1: string[], ingredients2: string[]): boolean {
    const commonIngredients = ingredients1.filter((ing1) => ingredients2.some((ing2) => ing1.includes(ing2) || ing2.includes(ing1)));

    // 공통 재료가 2개 이상이고, 전체 재료의 50% 이상이면 유사한 것으로 판단
    return commonIngredients.length >= 2 && commonIngredients.length / Math.max(ingredients1.length, ingredients2.length) > 0.5;
  },

  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("Perplexity API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_PERPLEXITY_API_KEY를 추가해주세요.");
    }

    if (!apiKey.startsWith("pplx-")) {
      throw new Error('잘못된 Perplexity API 키 형식입니다. API 키는 "pplx-"로 시작해야 합니다.');
    }

    // 최대 3번까지 시도하여 중복되지 않는 레시피 생성
    for (let attempt = 1; attempt <= 3; attempt++) {
      const prompt = this.buildPrompt(request, attempt);

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
                content:
                  "당신은 한국 가정 요리의 전문가입니다. 주어진 식재료로 친숙하고 맛있는 요리를 만들어주세요. 한국인 사용자가 많기 때문에, 주어진 재료를 기반으로 김치찌개, 김치볶음밥, 된장찌개, 계란볶음밥, 라면, 제육볶음, 닭볶음탕, 감자조림, 시금치나물 등 일상적인 한국 요리를 우선적으로 제안하세요. 가장 중요한 것은 실제로 조리 과정에서 사용하는 재료만 재료 목록에 포함하는 것입니다. 사용하지 않는 재료는 절대 포함하지 마세요. 주어진 재료를 위주로 사용하고, 자세한 조리법을 제공해주세요. 한국어로 답변해주세요.",
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
          const errorText = await response.text();
          throw new Error(`Perplexity API 오류: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const recipeText = data.choices[0].message.content;

        const recipe = this.parseRecipeResponse(recipeText, request);

        // 중복 검사
        const isDuplicate = await this.checkDuplicateRecipe(recipe.name, request.ingredients);

        if (isDuplicate) {
          if (attempt === 3) {
            throw new Error("중복되지 않는 레시피를 생성하지 못했습니다. 다른 재료로 시도해주세요.");
          }
          continue; // 다음 시도로 넘어감
        }

        // 레시피 생성 후 이미지 생성 시도
        try {
          const imageUrl = await this.generateRecipeImage(recipe.name, recipe.ingredients);
          recipe.image = imageUrl;
        } catch (imageError) {
          console.warn("이미지 생성 실패:", imageError);
          // 이미지 생성 실패해도 레시피는 반환
        }

        // 응답 검증 및 기본값 설정
        const validatedRecipe = {
          name: recipe.name || "AI 생성 레시피",
          ingredients: Array.isArray(recipe.ingredients)
            ? recipe.ingredients
                .map((ing: { name?: string; quantity?: string; isAvailable?: boolean }) => ({
                  name: ing.name || "재료",
                  quantity: ing.quantity || "적당량",
                  isAvailable: ing.isAvailable !== undefined ? ing.isAvailable : true,
                }))
                .filter((ing) => ing.name && ing.name.trim() !== "") // 빈 재료명 제거
            : request.ingredients.map((name) => ({ name, quantity: "적당량", isAvailable: true })),
          instructions: Array.isArray(recipe.instructions)
            ? recipe.instructions.filter((step: unknown) => step && typeof step === "string")
            : ["재료를 준비합니다.", "조리합니다.", "완성!"],
          cookingTime: typeof recipe.cookingTime === "number" ? recipe.cookingTime : 30,
          difficulty: ["easy", "medium", "hard"].includes(recipe.difficulty) ? recipe.difficulty : "medium",
          servings: typeof recipe.servings === "number" ? recipe.servings : 2,
          tags: Array.isArray(recipe.tags) ? recipe.tags : ["AI생성"],
          nutritionInfo: recipe.nutritionInfo || undefined,
          tips: Array.isArray(recipe.tips) ? recipe.tips : [],
        };

        // 모든 재료 표시 (필터링 제거)
        return validatedRecipe;
      } catch (error) {
        console.error(`시도 ${attempt} 실패:`, error);

        if (attempt === 3) {
          // 마지막 시도에서도 실패한 경우 에러 던지기
          if (error instanceof Error) {
            if (error.message.includes("API 키")) {
              throw new Error("Perplexity API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.");
            } else if (error.message.includes("네트워크")) {
              throw new Error("네트워크 연결을 확인해주세요.");
            } else if (error.message.includes("JSON") || error.message.includes("파싱")) {
              throw new Error("AI가 올바른 레시피를 생성하지 못했습니다. 다시 시도해주세요.");
            } else {
              throw new Error(`레시피 생성에 실패했습니다: ${error.message}`);
            }
          } else {
            throw new Error("레시피 생성에 실패했습니다. 다시 시도해주세요.");
          }
        }
      }
    }

    throw new Error("레시피 생성에 실패했습니다. 다시 시도해주세요.");
  },

  buildPrompt(request: AIRecipeRequest, attempt: number): string {
    const { ingredients, difficulty = "medium", servings = 2, cuisine, dietary } = request;

    // 시도마다 다른 요리 스타일 제안
    const cookingStyles = [
      "김치찌개, 김치볶음밥, 된장찌개, 계란볶음밥, 라면, 스팸볶음밥, 제육볶음, 닭볶음탕, 감자조림, 시금치나물",
      "된장찌개, 계란볶음밥, 라면, 스팸볶음밥, 제육볶음, 닭볶음탕, 감자조림, 시금치나물, 김치찌개, 김치볶음밥",
      "계란볶음밥, 라면, 스팸볶음밥, 제육볶음, 닭볶음탕, 감자조림, 시금치나물, 김치찌개, 김치볶음밥, 된장찌개",
    ];

    const currentStyle = cookingStyles[(attempt - 1) % cookingStyles.length];

    const prompt = `다음 식재료로 만들 수 있는 가장 적합한 하나의 친숙하고 맛있는 요리를 정확한 JSON 형식으로만 답변해주세요. 다른 설명이나 텍스트는 절대 포함하지 마세요.

중요한 요구사항:
1. 반드시 하나의 레시피만 생성하세요. 여러 레시피를 제안하지 마세요.
2. 주어진 재료 중 실제로 사용하는 재료만 재료 목록에 포함하세요. 사용하지 않는 재료는 절대 포함하지 마세요.
3. ${currentStyle} 등 친숙한 한국 요리를 우선적으로 제안하세요
4. 기본적인 조미료(소금, 후추, 식용유, 간장, 고춧가루, 밥, 물 등)는 있다고 가정하고 사용해도 됩니다
5. 요리 이름은 한국어로 친숙하게 작성해주세요. 대신 김치 주재료 요리, 마요네즈 주재료 요리 등과 같은 요리명은 사용하지 마세요
6. 조리법은 최대한 자세하게 작성해주세요. 조리 과정에서 사용하는 재료는 모두 재료 목록에 포함해주세요.
7. 모든 조리 용어와 설명은 반드시 한국어로 작성해주세요
8. 조리 과정에서 사용하는 모든 단위는 한국식 단위로 표기해주세요 (g, ml, 개, 잔, 큰술, 작은술 등)
9. 주어진 재료 중에서 사용하는 것만 "isAvailable": true로 표시하고, 추가로 필요한 재료는 "isAvailable": false로 표시하세요
10. 반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

주어진 재료: ${ingredients.join(", ")}
난이도: ${difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}
인분: ${servings}인분

${cuisine ? `요리 종류: ${cuisine}` : ""}
${dietary && dietary.length > 0 ? `식이 제한: ${dietary.join(", ")}` : ""}

다음 형식으로 정확히 답변해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "친숙한 한국 요리명",
  "ingredients": [
    {"name": "주어진 재료명", "quantity": "정확한 수량", "isAvailable": true},
    {"name": "추가 필요한 재료명", "quantity": "정확한 수량", "isAvailable": false}
  ],
  "instructions": [
    "1단계: 간단하고 실용적인 조리 설명",
    "2단계: 구체적인 조리 방법 설명",
    "3단계: 완성 단계 설명"
  ],
  "cookingTime": 20,
  "difficulty": "easy",
  "servings": 2,
  "tags": ["한국요리", "태그2"],
  "tips": ["조리 팁1", "조리 팁2"]
}

요리 제안 가이드:
- 김치가 있다면: 김치찌개, 김치볶음밥, 김치국수
- 돼지고기가 있다면: 제육볶음, 돼지고기볶음, 삼겹살구이
- 닭고기가 있다면: 닭볶음탕, 닭갈비, 닭볶음
- 감자가 있다면: 감자조림, 감자볶음, 감자탕
- 계란이 있다면: 계란볶음밥, 계란말이, 계란국
- 라면이 있다면: 라면, 라면볶음, 라면국수
- 스팸이 있다면: 스팸볶음밥, 스팸구이, 스팸김치찌개
- 된장이 있다면: 된장찌개, 된장국, 된장볶음
- 시금치가 있다면: 시금치나물, 시금치볶음, 시금치국

조리법 작성 시 주의사항:
- 각 단계를 아주 자세하게 실용적으로 설명해주세요
- 단계는 5단계 이상으로 아주 자세하게 작성합니다
- 시간, 불 세기 등 구체적인 수치 포함
- 한국어 조리 용어 사용 (볶기, 끓이기, 굽기, 찌기 등)
- 단위는 한국식으로 표기 (큰술, 작은술, 컵, 개, g, ml 등)

재료 목록 작성 시 주의사항:
- 실제로 조리 과정에서 사용하는 재료만 포함하세요
- 사용하지 않는 재료는 절대 포함하지 마세요
- 주어진 재료 중에서 사용하는 것만 "isAvailable": true로 표시
- 추가로 필요한 재료는 "isAvailable": false로 표시
- 재료명은 한국어로 작성합니다. 대신 김치 주재료 요리, 마요네즈 주재료 요리 등과 같은 요리명은 사용하지 마세요

중요: 반드시 하나의 레시피만 JSON 형식으로 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.`;

    return prompt;
  },

  // 검색 기반 레시피 생성을 위한 프롬프트
  buildSearchPrompt(recipeName: string): string {
    const prompt = `"${recipeName}" 요리의 전통적이고 정확한 레시피를 JSON 형식으로만 답변해주세요. 다른 설명이나 텍스트는 절대 포함하지 마세요.

중요한 요구사항:
1. 반드시 "${recipeName}" 요리만 생성하세요. 다른 요리로 변경하지 마세요.
2. "${recipeName}"의 전통적이고 정통적인 조리법을 따라주세요.
3. 요리 이름은 정확히 "${recipeName}"으로 작성하세요.
4. 사용자가 가진 재료와 상관없이 "${recipeName}"에 필요한 모든 전통적인 재료를 포함하세요.
5. 조리법은 최대한 자세하고 정확하게 작성해주세요.
6. 모든 조리 용어와 설명은 한국어로 작성해주세요.
7. 조리 과정에서 사용하는 모든 단위는 한국식 단위로 표기해주세요 (g, ml, 개, 잔, 큰술, 작은술 등).
8. 모든 재료는 "isAvailable": false로 표시하세요 (사용자가 가진 재료가 아니므로).
9. 반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

다음 형식으로 정확히 답변해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "${recipeName}",
  "ingredients": [
    {"name": "주요 재료명", "quantity": "정확한 수량", "isAvailable": false},
    {"name": "조미료명", "quantity": "정확한 수량", "isAvailable": false},
    {"name": "부재료명", "quantity": "정확한 수량", "isAvailable": false}
  ],
  "instructions": [
    "1단계: ${recipeName}의 첫 번째 조리 단계",
    "2단계: ${recipeName}의 두 번째 조리 단계",
    "3단계: ${recipeName}의 세 번째 조리 단계",
    "4단계: ${recipeName}의 네 번째 조리 단계",
    "5단계: ${recipeName} 완성 단계"
  ],
  "cookingTime": 30,
  "difficulty": "medium",
  "servings": 2,
  "tags": ["${recipeName}", "요리종류"],
  "tips": ["${recipeName} 조리 팁1", "${recipeName} 조리 팁2"]
}

조리법 작성 시 주의사항:
- "${recipeName}"의 전통적이고 정통적인 조리법을 정확히 따라주세요.
- 각 단계를 아주 자세하게 실용적으로 설명해주세요.
- 시간, 불 세기 등 구체적인 수치를 포함해주세요.
- 해당 요리의 특성에 맞는 조리 용어를 사용해주세요.
- 단위는 한국식으로 표기해주세요 (큰술, 작은술, 컵, 개, g, ml 등).

재료 목록 작성 시 주의사항:
- "${recipeName}"에 필요한 모든 전통적인 재료들을 포함해주세요.
- 사용자가 가진 재료와 상관없이 완전한 레시피를 제공하세요.
- 모든 재료는 "isAvailable": false로 표시하세요.
- 재료명은 한국어로 작성하세요.
- 주재료, 조미료, 부재료를 모두 포함하세요.

중요: 반드시 "${recipeName}" 요리만 JSON 형식으로 응답하세요. 다른 요리로 변경하지 마세요.`;

    return prompt;
  },

  parseRecipeResponse(recipeText: string, request: AIRecipeRequest): AIRecipeResponse {
    try {
      // JSON 부분 추출 - 여러 JSON 중 첫 번째 완전한 것 선택
      const jsonMatches = recipeText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      if (!jsonMatches || jsonMatches.length === 0) {
        throw new Error("AI가 올바른 형식의 레시피를 생성하지 못했습니다. 다시 시도해주세요.");
      }

      // 첫 번째 완전한 JSON 선택
      let jsonString = jsonMatches[0];

      // JSON 문자열 정리 (최소한의 정리만 수행)
      jsonString = jsonString
        .replace(/\n/g, " ") // 줄바꿈 제거
        .replace(/\r/g, "") // 캐리지 리턴 제거
        .replace(/\t/g, " ") // 탭 제거
        .replace(/\s+/g, " ") // 연속된 공백을 하나로
        .trim();

      // JSON 파싱 시도
      let recipe: AIRecipeResponse;
      try {
        recipe = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);

        // 최소한의 JSON 수정만 수행
        jsonString = this.minimalJsonFix(jsonString);

        try {
          recipe = JSON.parse(jsonString);
        } catch (secondError) {
          console.error("수정 후에도 파싱 실패:", secondError);
          throw new Error("AI 응답을 처리할 수 없습니다. 다시 시도해주세요.");
        }
      }

      // 응답 검증 및 기본값 설정 (원본 데이터 최대한 보존)
      const validatedRecipe = {
        name: recipe.name || "AI 생성 레시피",
        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients.map((ing: { name?: string; quantity?: string; isAvailable?: boolean }) => ({
              name: ing.name || "재료",
              quantity: ing.quantity || "적당량",
              isAvailable: ing.isAvailable !== undefined ? ing.isAvailable : true,
            }))
          : request.ingredients.map((name) => ({ name, quantity: "적당량", isAvailable: true })),
        instructions: Array.isArray(recipe.instructions)
          ? recipe.instructions.filter((step: unknown) => step && typeof step === "string")
          : ["재료를 준비합니다.", "조리합니다.", "완성!"],
        cookingTime: typeof recipe.cookingTime === "number" ? recipe.cookingTime : 30,
        difficulty: ["easy", "medium", "hard"].includes(recipe.difficulty) ? recipe.difficulty : "medium",
        servings: typeof recipe.servings === "number" ? recipe.servings : 2,
        tags: Array.isArray(recipe.tags) ? recipe.tags : ["AI생성"],
        nutritionInfo: recipe.nutritionInfo || undefined,
        tips: Array.isArray(recipe.tips) ? recipe.tips : [],
      };

      return validatedRecipe;
    } catch (error) {
      console.error("레시피 파싱 오류:", error);
      throw error; // 에러를 다시 던져서 상위에서 처리하도록 함
    }
  },

  // 최소한의 JSON 수정 (원본 데이터 최대한 보존)
  minimalJsonFix(jsonString: string): string {
    // 1. 따옴표 없는 키 이름에만 따옴표 추가
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // 2. 마지막 쉼표 제거
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

    // 3. 불완전한 문자열 닫기
    jsonString = jsonString.replace(/"([^"]*)$/g, '$1"');

    return jsonString;
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

  // 이미지 검색 (Unsplash API 사용 - 무료 이미지)
  async generateRecipeImage(
    recipeName: string,
    ingredients: Array<{ name: string; quantity: string; isAvailable: boolean }>
  ): Promise<string> {
    try {
      // 레시피 이름과 주요 재료로 검색어 구성
      const mainIngredients = ingredients
        .filter((ing) => ing.isAvailable)
        .map((ing) => ing.name)
        .slice(0, 3);

      // 더 구체적이고 정확한 검색어 구성
      let searchQuery = "";

      // 레시피 이름에 "요리", "볶음", "구이" 등의 키워드가 있는지 확인
      if (recipeName.includes("볶음") || recipeName.includes("볶아")) {
        searchQuery = `${mainIngredients.join(" ")} 볶음 요리`;
      } else if (recipeName.includes("구이") || recipeName.includes("구워")) {
        searchQuery = `${mainIngredients.join(" ")} 구이 요리`;
      } else if (recipeName.includes("찌개") || recipeName.includes("국")) {
        searchQuery = `${mainIngredients.join(" ")} 찌개 국`;
      } else if (recipeName.includes("샐러드") || recipeName.includes("무침")) {
        searchQuery = `${mainIngredients.join(" ")} 샐러드 무침`;
      } else if (recipeName.includes("튀김") || recipeName.includes("튀겨")) {
        searchQuery = `${mainIngredients.join(" ")} 튀김 요리`;
      } else {
        // 기본 검색어
        searchQuery = `${recipeName} ${mainIngredients.join(" ")} 음식`;
      }

      // 검색어에 "한국 음식" 추가하여 더 정확한 결과 얻기
      searchQuery += " 한국 음식";

      // Unsplash API로 음식 이미지 검색 (무료, 저작권 문제 없음)
      const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

      if (!unsplashKey) {
        console.warn("Unsplash API key not found, using fallback image");
        return this.getFallbackImage();
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashKey}`,
          },
        }
      );

      if (!response.ok) {
        console.warn("Unsplash API error, using fallback image");
        return this.getFallbackImage();
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // 첫 번째 이미지가 부적절하면 다른 이미지 시도
        for (let i = 0; i < Math.min(data.results.length, 3); i++) {
          const image = data.results[i];
          // 이미지 설명이나 태그를 확인하여 적절성 판단
          const description = (image.description || image.alt_description || "").toLowerCase();
          const tags = (image.tags || []).map((tag: { title: string }) => tag.title.toLowerCase());

          // 부적절한 키워드가 있는지 확인
          const inappropriateKeywords = ["raw", "uncooked", "ingredient", "market", "grocery", "vegetable", "fruit"];
          const hasInappropriateKeyword = inappropriateKeywords.some(
            (keyword) => description.includes(keyword) || tags.some((tag: string) => tag.includes(keyword))
          );

          if (!hasInappropriateKeyword) {
            return image.urls.regular;
          }
        }

        // 모든 이미지가 부적절하면 첫 번째 이미지 사용
        return data.results[0].urls.regular;
      } else {
        return this.getFallbackImage();
      }
    } catch (error) {
      console.error("Image search error:", error);
      return this.getFallbackImage();
    }
  },

  // 기본 음식 이미지 반환
  getFallbackImage(): string {
    return "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop";
  },
};

// 통합 AI 서비스 (Perplexity AI만 사용)
export const aiService = {
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    return await perplexityService.generateRecipe(request);
  },

  async generateRecipeFromSearch(recipeName: string): Promise<AIRecipeResponse> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("Perplexity API 키가 설정되지 않았습니다.");
    }

    const prompt = this.buildSearchPrompt(recipeName);

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
              content: "당신은 요리의 전문가입니다. 사용자가 요청한 특정 요리의 정확한 레시피를 제공해주세요.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API 오류: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const recipeText = data.choices[0].message.content;

      return perplexityService.parseRecipeResponse(recipeText, { ingredients: [recipeName] });
    } catch (error) {
      console.error("검색 기반 레시피 생성 실패:", error);
      throw error;
    }
  },

  async getSeasonalIngredients(): Promise<string[]> {
    return await perplexityService.getSeasonalIngredients();
  },

  async getCookingTips(ingredient: string): Promise<string[]> {
    return await perplexityService.getCookingTips(ingredient);
  },

  buildSearchPrompt(recipeName: string): string {
    return perplexityService.buildSearchPrompt(recipeName);
  },
};
