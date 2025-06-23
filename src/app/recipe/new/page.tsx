"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeFormData, Ingredient } from "@/types";
import { Save, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { recipeService, ingredientService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";
import { useAuth } from "@/lib/auth-context";

export default function NewRecipePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    image: "",
    ingredients: "",
    instructions: "",
    cookingTime: 30,
    difficulty: "medium",
    servings: 2,
    tags: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAvailableIngredients = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await ingredientService.getAllIngredients(user.id);
      setAvailableIngredients(data);
    } catch (err) {
      console.error("식재료 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAvailableIngredients();
    }
  }, [user, loadAvailableIngredients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!formData.name.trim() || !formData.ingredients.trim() || !formData.instructions.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 재료와 조리법을 배열로 변환
      const ingredientsArray = formData.ingredients
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((name) => ({ name, quantity: "적당량", isAvailable: true }));

      const instructionsArray = formData.instructions
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const recipeData = {
        name: formData.name.trim(),
        image: formData.image || undefined,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        cookingTime: formData.cookingTime,
        difficulty: formData.difficulty,
        servings: formData.servings,
        tags: formData.tags,
        createdBy: user.id,
        authorEmail: user.email || "",
      };

      await recipeService.addRecipe(recipeData, user.id);
      alert("레시피가 저장되었습니다!");

      // 폼 초기화
      setFormData({
        name: "",
        image: "",
        ingredients: "",
        instructions: "",
        cookingTime: 30,
        difficulty: "medium",
        servings: 2,
        tags: [],
      });
    } catch (err) {
      console.error("레시피 저장 실패:", err);
      alert("레시피 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.ingredients.trim()) {
      alert("AI 레시피 생성을 위해 식재료를 입력해주세요.");
      return;
    }

    setIsGenerating(true);

    try {
      // 식재료 목록 추출
      const ingredientNames = formData.ingredients
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // AI 레시피 생성
      const aiRecipe = await aiService.generateRecipe({
        ingredients: ingredientNames,
        difficulty: formData.difficulty,
        servings: formData.servings,
      });

      // 폼에 AI 생성 결과 적용
      setFormData((prev) => ({
        ...prev,
        name: aiRecipe.name,
        ingredients: aiRecipe.ingredients.map((ing) => `${ing.name} ${ing.quantity}`).join("\n"),
        instructions: aiRecipe.instructions.join("\n"),
        cookingTime: aiRecipe.cookingTime,
        difficulty: aiRecipe.difficulty,
        servings: aiRecipe.servings,
        tags: aiRecipe.tags,
      }));
    } catch (error) {
      console.error("AI 레시피 생성 실패:", error);
      alert("AI 레시피 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag),
    }));
  };

  const addAvailableIngredient = (ingredient: Ingredient) => {
    const ingredientText = `${ingredient.name} ${ingredient.quantity || ""}`.trim();
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients ? `${prev.ingredients}\n${ingredientText}` : ingredientText,
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">레시피를 등록하려면 로그인해주세요.</p>
          <Link href="/auth">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">레시피 등록</h1>
          <p className="text-sm sm:text-base text-gray-600">새로운 레시피를 등록하거나 AI로 레시피를 생성해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 직접 등록 폼 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>직접 등록</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">레시피명 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="예: 감자 양파 스크램블 에그"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지 URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com/image.jpg"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">식재료 *</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ingredients: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={4}
                      placeholder="감자 2개&#10;양파 1개&#10;계란 3개"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">조리법 *</label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={6}
                      placeholder="1. 감자를 깨끗이 씻어서 껍질을 벗깁니다.&#10;2. 양파를 다집니다.&#10;3. 감자를 작은 조각으로 썰어줍니다."
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">조리시간 (분)</label>
                      <input
                        type="number"
                        value={formData.cookingTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cookingTime: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as "easy" | "medium" | "hard" }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={isSubmitting}
                      >
                        <option value="easy">쉬움</option>
                        <option value="medium">보통</option>
                        <option value="hard">어려움</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">인분</label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData((prev) => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                    <div className="flex flex-wrap gap-2">
                      {["한식", "양식", "중식", "일식", "간단", "건강식", "디저트", "메인요리", "반찬"].map((tag) => (
                        <label key={tag} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.tags.includes(tag)}
                            onChange={(e) => handleTagChange(tag, e.target.checked)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700">
                      <Save className="h-4 w-4" />
                      <span>{isSubmitting ? "저장 중..." : "레시피 저장"}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI 생성 및 식재료 */}
          <div className="space-y-6">
            {/* AI 레시피 생성 */}
            <Card>
              <CardHeader>
                <CardTitle>AI 레시피 생성</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">입력한 식재료로 AI가 레시피를 자동으로 생성해드립니다.</p>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !formData.ingredients.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "생성 중..." : "AI 레시피 생성"}
                </Button>
              </CardContent>
            </Card>

            {/* 내 식재료 */}
            <Card>
              <CardHeader>
                <CardTitle>내 식재료</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-gray-500">로딩 중...</p>
                ) : availableIngredients.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">클릭하여 식재료를 추가하세요</p>
                    {availableIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => addAvailableIngredient(ingredient)}
                        className="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                        disabled={isSubmitting}
                      >
                        {ingredient.name} {ingredient.quantity && `(${ingredient.quantity})`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">등록된 식재료가 없습니다</p>
                    <Link href="/ingredients">
                      <Button variant="outline" size="sm">
                        식재료 등록하기
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
