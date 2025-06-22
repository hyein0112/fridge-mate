"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeFormData, Ingredient } from "@/types";
import { Save, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { recipeService, ingredientService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";

export default function NewRecipePage() {
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

  // 임시 사용자 ID (나중에 인증 시스템으로 교체)
  const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    loadAvailableIngredients();
  }, []);

  const loadAvailableIngredients = async () => {
    try {
      setLoading(true);
      const data = await ingredientService.getAllIngredients(TEMP_USER_ID);
      setAvailableIngredients(data);
    } catch (err) {
      console.error("식재료 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        createdBy: TEMP_USER_ID,
      };

      await recipeService.addRecipe(recipeData, TEMP_USER_ID);
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">재료 *</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ingredients: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="재료를 한 줄씩 입력하세요&#10;예: 감자 2개&#10;양파 1개&#10;계란 3개"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">조리법 *</label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="조리 단계를 한 줄씩 입력하세요&#10;예: 1. 감자를 깍둑썰기합니다.&#10;2. 양파를 다집니다.&#10;3. 팬에 기름을 두릅니다."
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {["한식", "양식", "중식", "일식", "간단", "저렴", "건강", "아침", "점심", "저녁"].map((tag) => (
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

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "저장 중..." : "레시피 저장"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI 생성 및 보유 식재료 */}
          <div className="space-y-6">
            {/* AI 레시피 생성 */}
            <Card>
              <CardHeader>
                <CardTitle>AI 레시피 생성</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">입력한 식재료로 AI가 레시피를 생성해드립니다.</p>
                <Button
                  onClick={handleAIGenerate}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  disabled={isGenerating || isSubmitting}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "생성 중..." : "AI로 레시피 생성"}
                </Button>
              </CardContent>
            </Card>

            {/* 보유 식재료 */}
            <Card>
              <CardHeader>
                <CardTitle>보유 식재료</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">로딩 중...</p>
                  </div>
                ) : availableIngredients.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">등록된 식재료가 없습니다.</p>
                    <Link href="/ingredients">
                      <Button size="sm" variant="outline">
                        식재료 추가하기
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">클릭하여 재료에 추가:</p>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {availableIngredients.map((ingredient) => (
                        <button
                          key={ingredient.id}
                          onClick={() => addAvailableIngredient(ingredient)}
                          className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                          disabled={isSubmitting}
                        >
                          {ingredient.name} {ingredient.quantity && `(${ingredient.quantity})`}
                        </button>
                      ))}
                    </div>
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
