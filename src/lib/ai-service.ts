// AI 레시피 생성 서비스
// 무료 옵션: Hugging Face Inference API 또는 로컬 모델
// 유료 옵션: OpenAI GPT, Anthropic Claude 등

export interface AIRecipeRequest {
  ingredients: string[];
  preferences?: string;
  difficulty?: "easy" | "medium" | "hard";
  servings?: number;
}

export interface AIRecipeResponse {
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  description: string;
  tips?: string[];
}

// 임시 AI 레시피 생성 함수 (실제 AI API 연동 전까지 사용)
export async function generateRecipeWithAI(request: AIRecipeRequest): Promise<AIRecipeResponse> {
  // 실제 구현에서는 여기에 AI API 호출 로직을 추가
  // 예: OpenAI GPT, Hugging Face, 또는 로컬 모델

  const { ingredients, difficulty = "medium", servings = 2 } = request;

  // 임시로 더미 데이터 생성
  const recipeTemplates = [
    {
      name: `${ingredients[0]} ${ingredients[1]} 볶음`,
      instructions: [
        `${ingredients[0]}을 적당한 크기로 썰어줍니다.`,
        `${ingredients[1]}을 다져서 준비합니다.`,
        "팬에 기름을 두르고 재료를 볶아줍니다.",
        "간장과 소금으로 간을 맞춥니다.",
        "완성!",
      ],
      cookingTime: 20,
      description: `${ingredients.join(", ")}을 활용한 간단한 볶음 요리입니다.`,
    },
    {
      name: `${ingredients[0]} ${ingredients[1]} 스튜`,
      instructions: [
        `${ingredients[0]}을 깍둑썰기합니다.`,
        `${ingredients[1]}을 적당한 크기로 썰어줍니다.`,
        "팬에 기름을 두르고 재료를 볶습니다.",
        "물을 넣고 끓여줍니다.",
        "월계수잎과 소금으로 간을 맞춥니다.",
        "완성!",
      ],
      cookingTime: 45,
      description: `${ingredients.join(", ")}을 활용한 따뜻한 스튜입니다.`,
    },
  ];

  const template = recipeTemplates[Math.floor(Math.random() * recipeTemplates.length)];

  return {
    name: template.name,
    ingredients: ingredients.map((ing) => `${ing} 적당량`),
    instructions: template.instructions,
    cookingTime: template.cookingTime,
    difficulty,
    servings,
    description: template.description,
    tips: [
      "재료는 미리 준비해두면 조리 시간을 단축할 수 있습니다.",
      "간은 조금씩 넣어가며 맞춰보세요.",
      "완성 후 5분 정도 숙성시키면 더 맛있습니다.",
    ],
  };
}

// Hugging Face Inference API 사용 예시 (무료)
export async function generateRecipeWithHuggingFace(request: AIRecipeRequest): Promise<AIRecipeResponse> {
  // Hugging Face Inference API 사용
  // https://huggingface.co/inference-api
  // 무료로 사용 가능하지만 요청 제한이 있음

  const API_URL = "https://api-inference.huggingface.co/models/gpt2";
  const API_KEY = process.env.HUGGING_FACE_API_KEY; // 환경변수에서 가져오기

  if (!API_KEY) {
    throw new Error("Hugging Face API 키가 설정되지 않았습니다.");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `재료: ${request.ingredients.join(", ")}로 만드는 레시피:`,
        parameters: {
          max_length: 200,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("AI API 호출에 실패했습니다.");
    }

    // 응답 파싱 및 레시피 형식으로 변환
    // 실제 구현에서는 AI 응답을 적절히 파싱해야 함

    return {
      name: "AI 생성 레시피",
      ingredients: request.ingredients.map((ing) => `${ing} 적당량`),
      instructions: ["AI가 생성한 조리법을 확인해주세요."],
      cookingTime: 30,
      difficulty: request.difficulty || "medium",
      servings: request.servings || 2,
      description: "AI가 생성한 레시피입니다.",
    };
  } catch (error) {
    console.error("AI 레시피 생성 실패:", error);
    throw error;
  }
}

// OpenAI GPT 사용 예시 (유료)
export async function generateRecipeWithOpenAI(request: AIRecipeRequest): Promise<AIRecipeResponse> {
  // OpenAI GPT API 사용
  // https://platform.openai.com/docs/api-reference
  // 유료 서비스이지만 안정적이고 품질이 좋음

  const API_KEY = process.env.OPENAI_API_KEY;

  if (!API_KEY) {
    throw new Error("OpenAI API 키가 설정되지 않았습니다.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "당신은 요리 전문가입니다. 주어진 재료로 맛있는 레시피를 만들어주세요.",
          },
          {
            role: "user",
            content: `재료: ${request.ingredients.join(", ")}로 ${request.difficulty} 난이도의 ${
              request.servings
            }인분 레시피를 만들어주세요.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API 호출에 실패했습니다.");
    }

    // 응답 파싱 및 레시피 형식으로 변환
    // 실제 구현에서는 AI 응답을 적절히 파싱해야 함

    return {
      name: "AI 생성 레시피",
      ingredients: request.ingredients.map((ing) => `${ing} 적당량`),
      instructions: ["AI가 생성한 조리법을 확인해주세요."],
      cookingTime: 30,
      difficulty: request.difficulty || "medium",
      servings: request.servings || 2,
      description: "AI가 생성한 레시피입니다.",
    };
  } catch (error) {
    console.error("AI 레시피 생성 실패:", error);
    throw error;
  }
}
