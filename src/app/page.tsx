"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipe/recipe-card";
import { Ingredient, Recipe } from "@/types";
import { Plus, Sparkles } from "lucide-react";
import { ingredientService, recipeService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { resetScrollPosition } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 레시피는 항상 로드
      const recipesData = await recipeService.getAllRecipes();
      setRecipes(recipesData);

      // 식재료는 로그인한 경우에만 로드
      if (user) {
        const ingredientsData = await ingredientService.getAllIngredients(user.id);
        setIngredients(ingredientsData);
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    // 페이지 로드 시 스크롤 위치 초기화
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

      console.log("AI 레시피 생성 시작:", { ingredients: ingredientNames });

      const aiRecipe = await aiService.generateRecipe({
        ingredients: ingredientNames,
        difficulty: "easy",
        servings: 2,
      });

      console.log("AI 레시피 생성 완료:", aiRecipe);

      // 생성된 레시피를 데이터베이스에 저장
      const savedRecipe = await recipeService.addRecipe(
        {
          ...aiRecipe,
          createdBy: user.id,
          authorEmail: user.email || "",
        },
        user.id
      );

      console.log("레시피 저장 완료:", savedRecipe);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">오늘 뭐 만들까요? 🍳</h1>
          <p className="text-sm sm:text-base text-gray-600">보유한 식재료로 만들 수 있는 레시피를 추천해드려요</p>
        </div>

        {/* 로그인 안내 */}
        {!user && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">더 나은 경험을 위해 로그인하세요</h3>
                  <p className="text-sm text-blue-700 mt-1">식재료를 등록하고 개인화된 레시피 추천을 받아보세요</p>
                </div>
                <Link href="/auth">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    로그인하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 보유 식재료 섹션 */}
        {user && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">보유 식재료</h2>
              <Link href="/ingredients">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  식재료 추가
                </Button>
              </Link>
            </div>
            {ingredients.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-4">등록된 식재료가 없습니다.</p>
                <Link href="/ingredients">
                  <Button size="sm">
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
        )}

        {/* AI 레시피 생성 버튼 */}
        {user && (
          <div className="mb-6 sm:mb-8">
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              size="lg"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  AI 레시피 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI로 레시피 추천받기
                </>
              )}
            </Button>
          </div>
        )}

        {/* 레시피 섹션 */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{user ? "추천 레시피" : "모든 레시피"}</h2>
          {recipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">등록된 레시피가 없습니다.</p>
              {user ? (
                <Link href="/recipe/new">
                  <Button size="sm">
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
