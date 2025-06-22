export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  expiryDate?: Date;
  category?: string;
  createdAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  image?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  cookingTime: number; // minutes
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  isAvailable: boolean; // 사용자가 보유한 재료인지 여부
}

export interface RecipeCardProps {
  recipe: Recipe;
  missingIngredients: string[];
  onClick: () => void;
}

export interface IngredientFormData {
  name: string;
  quantity?: string;
  expiryDate?: string;
  category?: string;
}

export interface RecipeFormData {
  name: string;
  image?: string;
  ingredients: string;
  instructions: string;
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  servings: number;
  tags: string[];
}
