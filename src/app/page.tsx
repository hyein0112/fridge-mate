"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/recipe/recipe-card";
import { Ingredient, Recipe } from "@/types";
import { Plus, Sparkles } from "lucide-react";

// 임시 데이터 (나중에 실제 데이터로 교체)
const mockIngredients: Ingredient[] = [
  { id: "1", name: "감자", quantity: "3개", category: "야채", createdAt: new Date() },
  { id: "2", name: "양파", quantity: "2개", category: "야채", createdAt: new Date() },
  { id: "3", name: "계란", quantity: "6개", category: "유제품", createdAt: new Date() },
  { id: "4", name: "돼지고기", quantity: "300g", category: "육류", createdAt: new Date() },
];

const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "감자 양파 스크램블 에그",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    ingredients: [
      { name: "감자", quantity: "2개", isAvailable: true },
      { name: "양파", quantity: "1개", isAvailable: true },
      { name: "계란", quantity: "3개", isAvailable: true },
      { name: "버터", quantity: "1큰술", isAvailable: false },
    ],
    instructions: [
      "감자를 깍둑썰기하여 준비합니다.",
      "양파를 다져서 준비합니다.",
      "팬에 버터를 녹이고 감자를 볶습니다.",
      "양파를 추가하여 볶습니다.",
      "계란을 깨서 넣고 스크램블합니다.",
    ],
    cookingTime: 20,
    difficulty: "easy",
    servings: 2,
    tags: ["한식", "간단", "아침"],
    createdBy: "시스템",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "돼지고기 감자 스튜",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    ingredients: [
      { name: "돼지고기", quantity: "300g", isAvailable: true },
      { name: "감자", quantity: "2개", isAvailable: true },
      { name: "양파", quantity: "1개", isAvailable: true },
      { name: "당근", quantity: "1개", isAvailable: false },
      { name: "월계수잎", quantity: "2장", isAvailable: false },
    ],
    instructions: [
      "돼지고기를 적당한 크기로 썰어줍니다.",
      "감자와 양파를 깍둑썰기합니다.",
      "팬에 기름을 두르고 돼지고기를 볶습니다.",
      "감자와 양파를 추가하여 볶습니다.",
      "물을 넣고 끓여줍니다.",
    ],
    cookingTime: 45,
    difficulty: "medium",
    servings: 3,
    tags: ["한식", "메인요리"],
    createdBy: "시스템",
    createdAt: new Date(),
  },
];

export default function HomePage() {
  const [ingredients] = useState<Ingredient[]>(mockIngredients);
  const [recipes] = useState<Recipe[]>(mockRecipes);

  // 레시피별 부족한 재료 계산
  const getMissingIngredients = (recipe: Recipe): string[] => {
    return recipe.ingredients.filter((ingredient) => !ingredient.isAvailable).map((ingredient) => ingredient.name);
  };

  const handleRecipeClick = (recipeId: string) => {
    // 레시피 상세 페이지로 이동
    window.location.href = `/recipe/${recipeId}`;
  };

  const handleAIGenerate = () => {
    // AI 레시피 생성 기능 (나중에 구현)
    alert("AI 레시피 생성 기능은 준비 중입니다!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">오늘 뭐 만들까요? 🍳</h1>
          <p className="text-sm sm:text-base text-gray-600">보유한 식재료로 만들 수 있는 레시피를 추천해드려요</p>
        </div>

        {/* 보유 식재료 섹션 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">보유 식재료</h2>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              식재료 추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <span key={ingredient.id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                {ingredient.name} {ingredient.quantity && `(${ingredient.quantity})`}
              </span>
            ))}
          </div>
        </div>

        {/* AI 레시피 생성 버튼 */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={handleAIGenerate}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI로 레시피 추천받기
          </Button>
        </div>

        {/* 추천 레시피 섹션 */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">추천 레시피</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                missingIngredients={getMissingIngredients(recipe)}
                onClick={() => handleRecipeClick(recipe.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
