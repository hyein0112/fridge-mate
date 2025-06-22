import { supabase } from "./supabase";
import { Ingredient, Recipe } from "@/types";

// 식재료 관련 함수들
export const ingredientService = {
  // 모든 식재료 가져오기
  async getAllIngredients(userId: string): Promise<Ingredient[]> {
    const { data, error } = await supabase.from("ingredients").select("*").eq("user_id", userId).order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ingredients:", error);
      throw error;
    }

    return (
      data?.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        expiryDate: item.expiry_date ? new Date(item.expiry_date) : undefined,
        createdAt: new Date(item.created_at),
      })) || []
    );
  },

  // 식재료 추가
  async addIngredient(ingredient: Omit<Ingredient, "id" | "createdAt">, userId: string): Promise<Ingredient> {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name: ingredient.name,
        quantity: ingredient.quantity,
        category: ingredient.category,
        expiry_date: ingredient.expiryDate?.toISOString(),
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding ingredient:", error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      quantity: data.quantity,
      category: data.category,
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      createdAt: new Date(data.created_at),
    };
  },

  // 식재료 수정
  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<Ingredient> {
    const { data, error } = await supabase
      .from("ingredients")
      .update({
        name: updates.name,
        quantity: updates.quantity,
        category: updates.category,
        expiry_date: updates.expiryDate?.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating ingredient:", error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      quantity: data.quantity,
      category: data.category,
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      createdAt: new Date(data.created_at),
    };
  },

  // 식재료 삭제
  async deleteIngredient(id: string): Promise<void> {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);

    if (error) {
      console.error("Error deleting ingredient:", error);
      throw error;
    }
  },

  // 일괄 추가
  async bulkAddIngredients(ingredientNames: string[], userId: string): Promise<Ingredient[]> {
    const ingredients = ingredientNames.map((name) => ({
      name: name.trim(),
      user_id: userId,
    }));

    const { data, error } = await supabase.from("ingredients").insert(ingredients).select();

    if (error) {
      console.error("Error bulk adding ingredients:", error);
      throw error;
    }

    return (
      data?.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        expiryDate: item.expiry_date ? new Date(item.expiry_date) : undefined,
        createdAt: new Date(item.created_at),
      })) || []
    );
  },
};

// 레시피 관련 함수들
export const recipeService = {
  // 모든 레시피 가져오기
  async getAllRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
      throw error;
    }

    return (
      data?.map((item) => {
        try {
          const parsedIngredients = JSON.parse(item.ingredients);
          const parsedInstructions = JSON.parse(item.instructions);

          return {
            id: item.id,
            name: item.name,
            image: item.image,
            ingredients: Array.isArray(parsedIngredients) ? parsedIngredients : [],
            instructions: Array.isArray(parsedInstructions) ? parsedInstructions : [],
            cookingTime: item.cooking_time,
            difficulty: item.difficulty,
            servings: item.servings,
            tags: item.tags || [],
            createdBy: item.created_by,
            createdAt: new Date(item.created_at),
          };
        } catch (parseError) {
          console.error("Error parsing recipe data:", parseError);
          // 파싱 실패 시 기본값 반환
          return {
            id: item.id,
            name: item.name,
            image: item.image,
            ingredients: [],
            instructions: [],
            cookingTime: item.cooking_time,
            difficulty: item.difficulty,
            servings: item.servings,
            tags: item.tags || [],
            createdBy: item.created_by,
            createdAt: new Date(item.created_at),
          };
        }
      }) || []
    );
  },

  // 레시피 추가
  async addRecipe(recipe: Omit<Recipe, "id" | "createdAt">, userId: string): Promise<Recipe> {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        name: recipe.name,
        image: recipe.image,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: JSON.stringify(recipe.instructions),
        cooking_time: recipe.cookingTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        tags: recipe.tags,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding recipe:", error);
      throw error;
    }

    try {
      const parsedIngredients = JSON.parse(data.ingredients);
      const parsedInstructions = JSON.parse(data.instructions);

      return {
        id: data.id,
        name: data.name,
        image: data.image,
        ingredients: Array.isArray(parsedIngredients) ? parsedIngredients : [],
        instructions: Array.isArray(parsedInstructions) ? parsedInstructions : [],
        cookingTime: data.cooking_time,
        difficulty: data.difficulty,
        servings: data.servings,
        tags: data.tags || [],
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      };
    } catch (parseError) {
      console.error("Error parsing added recipe data:", parseError);
      throw new Error("레시피 데이터 파싱에 실패했습니다.");
    }
  },

  // 레시피 삭제
  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting recipe:", error);
      throw error;
    }
  },
};
