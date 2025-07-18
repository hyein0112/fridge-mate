"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Users, ChefHat, Tag, Edit } from "lucide-react";
import { Recipe } from "@/types";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import { formatTime } from "@/lib/utils";

export default function RecipeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadRecipe(params.id as string);
    }
  }, [params.id]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/recipes/${recipeId}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data) {
        setRecipe(data);
      } else {
        setError(data?.error || "레시피를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("레시피 로드 실패:", err);
      setError("레시피를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
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
      <div style={{ minHeight: "calc(100vh - 64px)" }} className="bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)" }} className="screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "레시피를 찾을 수 없습니다."}</p>
          <Link href="/">
            <Button variant="outline">메인으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{recipe.name}</h1>
              <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(recipe.cooking_time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings}인분</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getDifficultyColor(recipe.difficulty)}`}>
                  <ChefHat className="h-3 w-3" />
                  <span>{getDifficultyText(recipe.difficulty)}</span>
                </div>
              </div>
            </div>
            {user && recipe.createdBy === user.id && (
              <Link href={`/recipe/${recipe.id}/edit`}>
                <Button variant="outline" size="sm" className="bg-white text-gray-900 border">
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 레시피 이미지 */}
          {recipe.image && (
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-0">
                  <Image src={recipe.image} alt={recipe.name} className="w-full h-64 object-cover rounded-lg" width={256} height={256} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* 레시피 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 재료 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  재료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 ${
                        ingredient.isAvailable === false ? "opacity-60 bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${ingredient.isAvailable === false ? "text-gray-500" : "text-gray-900"}`}>
                          {ingredient.name}
                        </span>
                        {ingredient.isAvailable === false && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">추가 필요</span>
                        )}
                      </div>
                      <span className={`${ingredient.isAvailable === false ? "text-gray-400" : "text-gray-600"}`}>
                        {ingredient.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 조리법 */}
            <Card>
              <CardHeader>
                <CardTitle>조리법</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipe.instructions.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 조리 팁 */}
            {recipe.tips && recipe.tips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>조리 팁</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recipe.tips.map((tip, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          💡
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 leading-relaxed">{tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 태그 */}
            {recipe.tags && recipe.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    태그
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
