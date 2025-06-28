"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipe/recipe-card";
import { Ingredient, Recipe } from "@/types";
import { Plus, Sparkles, Search } from "lucide-react";
import { ingredientService, recipeService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { resetScrollPosition } from "@/lib/utils";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      let recipesData: Recipe[] = [];
      try {
        recipesData = await recipeService.getAllRecipes();
      } catch {
        recipesData = [];
      }
      setRecipes(recipesData);

      let ingredientsData: Ingredient[] = [];
      if (user) {
        try {
          ingredientsData = await ingredientService.getAllIngredients(user.id);
        } catch {
          ingredientsData = [];
        }
      }
      setIngredients(ingredientsData);
    } catch {
      // 데이터를 불러오는데 실패했습니다.
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
    resetScrollPosition();
  }, [loadData]);

  // 레시피별 부족한 재료 계산
  const getMissingIngredients = (recipe: Recipe): string[] => {
    const availableIngredients = ingredients.map((ing) => ing.name.toLowerCase()).filter(Boolean);

    return recipe.ingredients
      .filter((ingredient) => ingredient.name && !availableIngredients.includes(ingredient.name.toLowerCase()))
      .map((ingredient) => ingredient.name!)
      .filter(Boolean);
  };

  const handleRecipeClick = (recipeId: string) => {
    // 레시피 상세 페이지로 이동
    router.push(`/recipe/${recipeId}`);
  };

  const handleAIGenerate = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (ingredients.length === 0) {
      alert("먼저 식재료를 등록해주세요!");
      return;
    }

    try {
      setAiLoading(true);

      // AI 레시피 생성
      const ingredientNames = ingredients.map((ing) => ing.name).filter((name) => name && name.trim() !== "");

      const aiRecipe = await aiService.generateRecipe({
        ingredients: ingredientNames,
        difficulty: "easy",
        servings: 2,
      });

      // 생성된 레시피를 데이터베이스에 저장
      const savedRecipe = await recipeService.addRecipe(
        {
          ...aiRecipe,
          createdBy: user.id,
          authorEmail: user.email || "",
        },
        user.id
      );

      // 레시피 상세 페이지로 이동
      router.push(`/recipe/${savedRecipe.id}`);
    } catch (error) {
      console.error("AI 레시피 생성 실패:", error);

      // 더 자세한 오류 메시지 표시
      let errorMessage = "AI 레시피 생성에 실패했습니다. 다시 시도해주세요.";

      if (error instanceof Error) {
        if (error.message.includes("API 키")) {
          errorMessage = "Perplexity API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.";
        } else if (error.message.includes("네트워크")) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        } else if (error.message.includes("올바른 레시피") || error.message.includes("JSON") || error.message.includes("파싱")) {
          errorMessage = "AI가 올바른 레시피를 생성하지 못했습니다. 다시 시도해주세요.";
        } else if (error.message.includes("중복되지 않는 레시피")) {
          errorMessage = "이미 비슷한 레시피가 있습니다. 다른 재료로 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)" }} className="bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)" }} className="flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">서비스를 이용하려면 로그인해주세요.</p>
          <Link href="/auth">
            <Button className="bg-white text-gray-900 border">로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)" }} className="bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">오늘 뭐 만들까요? 🍳</h1>
          <p className="text-sm sm:text-base text-gray-600">보유한 식재료로 만들 수 있는 레시피를 추천해드려요</p>
        </div>

        {/* 보유 식재료 섹션 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">보유 식재료</h2>
            <Link href="/ingredients" className="text-gray-900">
              <Button variant="outline" size="sm" className="w-full bg-white sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                식재료 추가
              </Button>
            </Link>
          </div>
          {ingredients.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">등록된 식재료가 없습니다.</p>
              <Link href="/ingredients">
                <Button size="sm" className="bg-white text-gray-900 border">
                  <Plus className="h-4 w-4 mr-2" />첫 식재료 추가하기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredients.slice(0, 10).map((ingredient) => (
                <span key={ingredient.id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                  {ingredient.name} {ingredient.quantity && `(${ingredient.quantity})`}
                </span>
              ))}
              {ingredients.length > 10 && (
                <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-500">
                  +{ingredients.length - 10}개 더
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI 레시피 생성 버튼 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading}
              className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50"
              size="lg"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  AI 추천 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-white" />
                  AI로 레시피 추천
                </>
              )}
            </Button>
            <Link href="/search">
              <Button className="w-full sm:w-auto border text-gray-900" size="lg">
                <Search className="h-4 w-4 mr-2 text-white" />
                AI로 레시피 검색
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-600 mt-2">💡 특정 요리를 찾고 싶다면 검색 기능을 이용해보세요!</p>
        </div>

        {/* 레시피 섹션 */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{user ? "추천 레시피" : "모든 레시피"}</h2>
          {recipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">등록된 레시피가 없습니다.</p>
              {user ? (
                <Link href="/recipe/new">
                  <Button size="sm" className="bg-white text-gray-900 border">
                    <Plus className="h-4 w-4 mr-2" />첫 레시피 추가하기
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="sm">로그인하고 레시피 추가하기</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {recipes.map((recipe) => {
                const missingIngredients = getMissingIngredients(recipe);
                return (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    missingIngredients={missingIngredients}
                    onClick={() => handleRecipeClick(recipe.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
