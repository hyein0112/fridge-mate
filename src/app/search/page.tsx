"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { recipeService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";
import { useAuth } from "@/lib/auth-context";
import { ChefHat, Clock, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Recipe } from "@/types";
import { formatTime } from "@/lib/utils";

export default function SearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  // 실시간 검색(디바운스) - 검색 실행은 여기서만!
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setGeneratedRecipe(null);
      return;
    }
    const timeout = setTimeout(() => {
      handleSearchWithQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchWithQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      // 1. DB에서만 검색
      const existingRecipes = await recipeService.searchRecipes(query);

      if (existingRecipes.length > 0) {
        setSearchResults(existingRecipes);
      }
      // DB에 없으면 아무것도 하지 않음 (AI 생성 X)
    } catch {
      // setError("검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. AI 생성 버튼 클릭 시에만 AI 생성
  const handleAIGenerate = async () => {
    if (!user) {
      alert("AI 레시피 생성을 위해 로그인이 필요합니다.");
      router.push("/auth");
      return;
    }
    setIsLoading(true);

    try {
      const aiResponse = await aiService.generateRecipeFromSearch(searchQuery);
      const savedRecipe = await recipeService.addRecipe(
        {
          ...aiResponse,
          createdBy: user.id,
          authorEmail: user.email ?? "",
          cooking_time: 0,
        },
        user.id
      );
      setGeneratedRecipe(savedRecipe);
    } catch {
      // setError("AI 레시피 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 버튼 클릭 시 handleSearchWithQuery 직접 호출
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    handleSearchWithQuery(searchQuery);
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "보통";
      case "hard":
        return "어려움";
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="pt-16 flex-1 flex flex-col max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">레시피 검색</h1>
          <p className="text-sm sm:text-base text-gray-600">원하는 요리를 검색하거나 AI로 새로운 레시피를 생성해보세요</p>
        </div>

        {/* 검색 폼 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="요리명, 재료, 태그 등을 검색해보세요 (예: 김치찌개, 감자조림, 계란볶음밥)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchResults([]);
                    setGeneratedRecipe(null);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-white text-gray-900 border"
                />
              </div>
              <Button onClick={handleSearch} className="w-full sm:w-auto bg-white text-gray-900 border">
                검색
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">검색 결과 ({searchResults.length}개)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {searchResults.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => handleRecipeClick(recipe.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                        {recipe.name}
                      </CardTitle>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getDifficultyColor(recipe.difficulty)}`}>
                        {getDifficultyText(recipe.difficulty)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(recipe.cooking_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <ChefHat className="h-4 w-4" />
                        <span>{recipe.servings}인분</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과가 없을 때 AI 생성 옵션 */}
        {searchQuery && searchResults.length === 0 && !isLoading && !generatedRecipe && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">&ldquo;{searchQuery}&rdquo;에 대한 검색 결과가 없습니다</h3>
                <p className="text-gray-600 mb-4">AI가 &ldquo;{searchQuery}&rdquo; 레시피를 새로 생성해드릴까요?</p>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isLoading ? "생성 중..." : "AI로 레시피 생성하기"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI로 생성된 레시피 결과 */}
        {generatedRecipe && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">AI가 생성한 레시피</h2>
            <Card
              className="mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleRecipeClick(generatedRecipe.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                    {generatedRecipe.name}
                  </CardTitle>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getDifficultyColor(generatedRecipe.difficulty)}`}
                  >
                    {getDifficultyText(generatedRecipe.difficulty)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(generatedRecipe.cooking_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <ChefHat className="h-4 w-4" />
                    <span>{generatedRecipe.servings}인분</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
