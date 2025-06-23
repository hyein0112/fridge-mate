// AI 레시피 생성 서비스
// Perplexity AI를 사용한 레시피 생성

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
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error("Perplexity API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_PERPLEXITY_API_KEY를 추가해주세요.");
    }

    if (!apiKey.startsWith("pplx-")) {
      throw new Error('잘못된 Perplexity API 키 형식입니다. API 키는 "pplx-"로 시작해야 합니다.');
    }

    const prompt = this.buildPrompt(request);

    try {
      console.log("Perplexity AI에 요청 전송 중...");
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
                "당신은 한국 가정 요리의 전문가입니다. 주어진 식재료로 친숙하고 맛있는 한국 요리를 만들어주세요. 김치찌개, 김치볶음밥, 된장찌개, 계란볶음밥, 라면, 제육볶음, 닭볶음탕, 감자조림, 시금치나물 등 일상적인 한국 요리를 우선적으로 제안하세요. 가장 중요한 것은 실제로 조리 과정에서 사용하는 재료만 재료 목록에 포함하는 것입니다. 사용하지 않는 재료는 절대 포함하지 마세요. 주어진 재료만 사용하고, 간단하고 실용적인 조리법을 제공해주세요. 한국어로 답변해주세요.",
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

      console.log("Perplexity API 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API 오류 응답:", errorText);
        throw new Error(`Perplexity API 오류: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Perplexity API 응답 데이터:", data);

      const recipeText = data.choices[0].message.content;

      const recipe = this.parseRecipeResponse(recipeText, request);

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

      // 실제 사용하는 재료만 필터링 (isAvailable이 true인 것만)
      validatedRecipe.ingredients = validatedRecipe.ingredients.filter((ing) => ing.isAvailable);

      return validatedRecipe;
    } catch (error) {
      console.error("Perplexity AI 오류:", error);
      throw new Error("레시피 생성에 실패했습니다. 다시 시도해주세요.");
    }
  },

  buildPrompt(request: AIRecipeRequest): string {
    const { ingredients, difficulty = "medium", servings = 2, cuisine, dietary } = request;

    const prompt = `다음 식재료로 만들 수 있는 친숙하고 맛있는 한국 요리를 JSON 형식으로만 답변해주세요. 다른 설명은 하지 마세요.

중요한 요구사항:
1. 주어진 재료 중에서 실제로 사용하는 재료만 재료 목록에 포함하세요. 사용하지 않는 재료는 절대 포함하지 마세요.
2. 김치찌개, 김치볶음밥, 된장찌개, 계란볶음밥, 라면, 스팸볶음밥, 제육볶음, 닭볶음탕, 감자조림, 시금치나물 등 친숙한 한국 요리를 우선적으로 제안하세요
3. 기본적인 조미료(소금, 후추, 식용유, 간장, 고춧가루, 밥, 물 등)는 있다고 가정하고 사용해도 됩니다
4. 요리 이름은 한국어로 친숙하게 작성해주세요. 대신 김치 주재료 요리, 마요네즈 주재료 요리 등과 같은 요리명은 사용하지 마세요
5. 조리법은 최대한 자세하게 실용적으로 작성해주세요
6. 모든 조리 용어와 설명은 반드시 한국어로 작성해주세요
7. 조리 과정에서 사용하는 모든 단위는 한국식 단위로 표기해주세요 (g, ml, 개, 잔, 큰술, 작은술 등)

주어진 재료: ${ingredients.join(", ")}
난이도: ${difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}
인분: ${servings}인분

${cuisine ? `요리 종류: ${cuisine}` : ""}
${dietary && dietary.length > 0 ? `식이 제한: ${dietary.join(", ")}` : ""}

다음 형식으로 정확히 답변해주세요:
{
  "name": "친숙한 한국 요리명",
  "ingredients": [
    {"name": "실제 사용하는 재료명만", "quantity": "정확한 수량", "isAvailable": true}
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
- 시간, 불 세기 등 구체적인 수치 포함
- 한국어 조리 용어 사용 (볶기, 끓이기, 굽기, 찌기 등)
- 단위는 한국식으로 표기 (큰술, 작은술, 컵, 개, g, ml 등)

재료 목록 작성 시 주의사항:
- 실제로 조리 과정에서 사용하는 재료만 포함하세요
- 사용하지 않는 재료는 절대 포함하지 마세요
- 주어진 재료 중에서 사용하는 것만 "isAvailable": true로 표시
- 추가 재료는 사용하지 마세요
- 재료명은 한국어로 작성합니다. 대신 김치 주재료 요리, 마요네즈 주재료 요리 등과 같은 요리명은 사용하지 마세요`;

    return prompt;
  },

  parseRecipeResponse(recipeText: string, request: AIRecipeRequest): AIRecipeResponse {
    try {
      console.log("Raw AI response:", recipeText);

      // JSON 부분 추출 - 더 정교한 정규식 사용
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log("No JSON found in response, using fallback");
        return this.createFallbackRecipe(request);
      }

      let jsonString = jsonMatch[0];

      // JSON 문자열 정리
      jsonString = jsonString
        .replace(/\n/g, " ") // 줄바꿈 제거
        .replace(/\r/g, "") // 캐리지 리턴 제거
        .replace(/\t/g, " ") // 탭 제거
        .replace(/\s+/g, " ") // 연속된 공백을 하나로
        .trim();

      console.log("Cleaned JSON string:", jsonString);

      // JSON 파싱 시도
      let recipe: AIRecipeResponse;
      try {
        recipe = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.log("Attempting to fix common JSON issues...");

        // 일반적인 JSON 오류 수정 시도
        jsonString = this.fixCommonJsonIssues(jsonString);

        try {
          recipe = JSON.parse(jsonString);
        } catch (secondError) {
          console.error("Second JSON parse error:", secondError);
          console.log("Attempting advanced JSON repair...");

          // 고급 JSON 수정 시도
          jsonString = this.advancedJsonRepair(jsonString);

          try {
            recipe = JSON.parse(jsonString);
          } catch (thirdError) {
            console.error("Third JSON parse error:", thirdError);
            console.log("Attempting final JSON repair...");

            // 최종 JSON 수정 시도
            jsonString = this.finalJsonRepair(jsonString);

            try {
              recipe = JSON.parse(jsonString);
            } catch (fourthError) {
              console.error("Fourth JSON parse error:", fourthError);
              console.log("Using fallback recipe due to JSON parsing failure");
              return this.createFallbackRecipe(request);
            }
          }
        }
      }

      // 응답 검증 및 기본값 설정
      return {
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
    } catch (error) {
      console.error("Recipe parsing error:", error);
      return this.createFallbackRecipe(request);
    }
  },

  // 일반적인 JSON 오류 수정
  fixCommonJsonIssues(jsonString: string): string {
    console.log("Fixing common JSON issues...");

    // 1. 따옴표 없는 키 이름 수정
    jsonString = jsonString.replace(/(\w+):/g, '"$1":');

    // 2. 마지막 쉼표 제거
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

    // 3. 불완전한 문자열 수정
    jsonString = jsonString.replace(/"([^"]*)$/g, '$1"');

    // 4. 이스케이프되지 않은 따옴표 수정
    jsonString = jsonString.replace(/([^\\])"/g, '$1\\"');

    // 5. 잘못된 이스케이프 시퀀스 수정
    jsonString = jsonString.replace(/\\"/g, '"');

    console.log("Fixed JSON string:", jsonString);
    return jsonString;
  },

  // 고급 JSON 수정 (더 강력한 수정 로직)
  advancedJsonRepair(jsonString: string): string {
    console.log("Advanced JSON repair started");

    // 1. 중첩된 따옴표 문제 해결
    jsonString = jsonString.replace(/""/g, '"');

    // 2. 불완전한 객체/배열 닫기
    let braceCount = 0;
    let bracketCount = 0;

    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === "{") braceCount++;
      if (jsonString[i] === "}") braceCount--;
      if (jsonString[i] === "[") bracketCount++;
      if (jsonString[i] === "]") bracketCount--;
    }

    // 누락된 닫는 괄호 추가
    while (braceCount > 0) {
      jsonString += "}";
      braceCount--;
    }
    while (bracketCount > 0) {
      jsonString += "]";
      bracketCount--;
    }

    // 3. 잘못된 쉼표 제거
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");
    jsonString = jsonString.replace(/,(\s*})/g, "$1");

    // 4. 빈 값 처리
    jsonString = jsonString.replace(/:\s*,/g, ': "",');
    jsonString = jsonString.replace(/:\s*}/g, ': ""}');

    // 5. 불완전한 배열/객체 수정
    jsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
    jsonString = jsonString.replace(/,\s*}/g, "}");

    console.log("Advanced JSON repair result:", jsonString);
    return jsonString;
  },

  // 최종 JSON 수정 (가장 강력한 수정 로직)
  finalJsonRepair(jsonString: string): string {
    console.log("Final JSON repair started");

    // 1. 모든 키에 따옴표 추가
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // 2. 모든 문자열 값에 따옴표 추가 (숫자나 boolean이 아닌 경우)
    jsonString = jsonString.replace(/:\s*([a-zA-Z가-힣][a-zA-Z0-9가-힣\s]*[a-zA-Z가-힣])\s*([,}])/g, ': "$1"$2');

    // 3. 배열 내 문자열에 따옴표 추가
    jsonString = jsonString.replace(/\[\s*([a-zA-Z가-힣][a-zA-Z0-9가-힣\s]*[a-zA-Z가-힣])\s*([,\]])/g, '["$1"$2');

    // 4. 중복된 따옴표 제거
    jsonString = jsonString.replace(/""/g, '"');

    // 5. 잘못된 쉼표 제거
    jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");
    jsonString = jsonString.replace(/,(\s*})/g, "$1");

    // 6. 불완전한 문자열 닫기
    jsonString = jsonString.replace(/"([^"]*)$/g, '$1"');

    console.log("Final JSON repair result:", jsonString);
    return jsonString;
  },

  // 기본 레시피 생성
  createFallbackRecipe(request: AIRecipeRequest): AIRecipeResponse {
    // 주어진 재료로 간단한 레시피 생성
    const availableIngredients = request.ingredients.map((name) => ({
      name,
      quantity: "적당량",
      isAvailable: true,
    }));

    // 기본 조미료 추가 (isAvailable: false로 표시)
    const basicSeasonings = [
      { name: "소금", quantity: "약간", isAvailable: false },
      { name: "후추", quantity: "약간", isAvailable: false },
      { name: "식용유", quantity: "1큰술", isAvailable: false },
    ];

    const allIngredients = [...availableIngredients, ...basicSeasonings];

    // 재료에 따른 친숙한 한국 요리 이름 생성
    let recipeName = "";
    const ingredients = request.ingredients.map((ing) => ing.toLowerCase());

    if (ingredients.some((ing) => ing.includes("김치"))) {
      recipeName = "김치볶음밥";
    } else if (ingredients.some((ing) => ing.includes("돼지고기") || ing.includes("삼겹살"))) {
      recipeName = "제육볶음";
    } else if (ingredients.some((ing) => ing.includes("닭고기"))) {
      recipeName = "닭볶음탕";
    } else if (ingredients.some((ing) => ing.includes("감자"))) {
      recipeName = "감자조림";
    } else if (ingredients.some((ing) => ing.includes("계란"))) {
      recipeName = "계란볶음밥";
    } else if (ingredients.some((ing) => ing.includes("라면"))) {
      recipeName = "라면";
    } else if (ingredients.some((ing) => ing.includes("스팸"))) {
      recipeName = "스팸볶음밥";
    } else if (ingredients.some((ing) => ing.includes("된장"))) {
      recipeName = "된장찌개";
    } else if (ingredients.some((ing) => ing.includes("시금치"))) {
      recipeName = "시금치나물";
    } else {
      // 기본 요리명
      recipeName = `${request.ingredients[0]} 요리`;
    }

    return {
      name: recipeName,
      ingredients: allIngredients,
      instructions: [
        "재료를 깨끗이 씻어 준비합니다.",
        "적절한 크기로 썰어줍니다.",
        "팬에 식용유를 두르고 재료를 볶아줍니다.",
        "소금, 후추로 간을 맞춰줍니다.",
        "완성되면 그릇에 담아 서빙합니다.",
      ],
      cookingTime: 20,
      difficulty: request.difficulty || "easy",
      servings: request.servings || 2,
      tags: ["한국요리", "AI생성", "간단요리"],
      tips: ["재료의 신선도를 확인하세요.", "조리 시간을 잘 지켜주세요.", "간은 조금씩 넣어가며 맞춰주세요."],
    };
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

      console.log("Searching for food image:", searchQuery);

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

  async getSeasonalIngredients(): Promise<string[]> {
    return await perplexityService.getSeasonalIngredients();
  },

  async getCookingTips(ingredient: string): Promise<string[]> {
    return await perplexityService.getCookingTips(ingredient);
  },
};
