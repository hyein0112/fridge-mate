"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeFormData, Ingredient } from "@/types";
import { Save, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { recipeService, ingredientService } from "@/lib/database";
import { aiService } from "@/lib/ai-service";
import { useAuth } from "@/lib/auth-context";

export default function NewRecipePage() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    image: "",
    ingredients: "",
    instructions: "",
    cookingTime: 30,
    difficulty: "medium",
    servings: 2,
    tags: [],
    category: "한식",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string>("한식");

  const loadAvailableIngredients = useCallback(async () => {
    if (!user) return;

    try {
      const data = await ingredientService.getAllIngredients(user.id);
      setAvailableIngredients(data);
    } catch (err) {
      console.error("식재료 로드 실패:", err);
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
        cooking_time: formData.cookingTime,
        difficulty: formData.difficulty,
        servings: formData.servings,
        tags: formData.tags,
        createdBy: user.id,
        authorEmail: user.email || "",
      };

      await recipeService.addRecipe({ ...recipeData, cooking_time: 0 }, user.id);
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

  const handleAIGenerate = async (category: string) => {
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
        cuisine: category,
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
        category: category,
      }));
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
    <div className="bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                      className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                      className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com/image.jpg"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">식재료 *</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ingredients: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                      className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as "easy" | "medium" | "hard" }))}
                        className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                            className="rounded border-gray-900 text-orange-600 focus:ring-orange-500"
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">요리 카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  >
                    <option value="한식">한식</option>
                    <option value="양식">양식</option>
                    <option value="중식">중식</option>
                    <option value="일식">일식</option>
                    <option value="이탈리안">이탈리안</option>
                  </select>
                </div>
                <Button
                  onClick={() => setIsCategoryModalOpen(true)}
                  disabled={isGenerating || !formData.ingredients.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="text-white">{isGenerating ? "AI 생성 중..." : "AI로 레시피 생성"}</span>
                </Button>
                {/* 카테고리 선택 모달 */}
                {isCategoryModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
                      <h3 className="text-lg font-semibold mb-4">요리 카테고리 선택</h3>
                      <select
                        value={pendingCategory}
                        onChange={(e) => setPendingCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-900 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
                        disabled={isGenerating}
                      >
                        <option value="한식">한식</option>
                        <option value="양식">양식</option>
                        <option value="중식">중식</option>
                        <option value="일식">일식</option>
                        <option value="이탈리안">이탈리안</option>
                      </select>
                      <div className="flex justify-end space-x-2">
                        <Button onClick={() => setIsCategoryModalOpen(false)} className="bg-gray-200 text-gray-900" disabled={isGenerating}>
                          취소
                        </Button>
                        <Button
                          onClick={async () => {
                            setIsCategoryModalOpen(false);
                            await handleAIGenerate(pendingCategory);
                          }}
                          className="bg-orange-600 text-white"
                          disabled={isGenerating}
                        >
                          선택
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 내 식재료 */}
            <Card>
              <CardHeader>
                <CardTitle>내 식재료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">클릭하여 식재료를 추가하세요</p>
                  {availableIngredients.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={() => addAvailableIngredient(ingredient)}
                      className="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-900"
                      disabled={isSubmitting}
                    >
                      {ingredient.name} {ingredient.quantity && `(${ingredient.quantity})`}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
