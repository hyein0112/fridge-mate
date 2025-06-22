"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeFormData } from "@/types";
import { Save, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.ingredients.trim() || !formData.instructions.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 여기서 레시피 저장 로직 구현
    console.log("레시피 저장:", formData);
    alert("레시피가 저장되었습니다!");
  };

  const handleAIGenerate = async () => {
    if (!formData.ingredients.trim()) {
      alert("AI 레시피 생성을 위해 식재료를 입력해주세요.");
      return;
    }

    setIsGenerating(true);

    try {
      // 여기서 AI API 호출
      // 임시로 더미 데이터 생성
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          name: "AI 생성 레시피",
          instructions: "1. 재료를 준비합니다.\n2. 팬에 기름을 두릅니다.\n3. 재료를 볶아줍니다.\n4. 완성!",
          cookingTime: 25,
          difficulty: "easy",
          servings: 2,
          tags: ["AI생성", "간단"],
        }));
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("AI 레시피 생성 실패:", error);
      alert("AI 레시피 생성에 실패했습니다.");
      setIsGenerating(false);
    }
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">레시피 등록</h1>
          <p className="text-sm sm:text-base text-gray-600">새로운 레시피를 등록하거나 AI로 레시피를 생성해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* 직접 등록 폼 */}
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as "easy" | "medium" | "hard" }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        />
                        <span className="text-sm text-gray-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  레시피 저장
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* AI 레시피 생성 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 레시피 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보유 식재료 *</label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ingredients: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="보유한 식재료를 입력하세요&#10;예: 감자, 양파, 계란, 돼지고기"
                  />
                </div>

                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "AI가 레시피를 생성하고 있습니다..." : "AI로 레시피 생성"}
                </Button>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">AI 레시피 생성 안내</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 보유한 식재료를 입력하면 AI가 레시피를 자동 생성합니다</li>
                    <li>• 생성된 레시피는 수정 후 저장할 수 있습니다</li>
                    <li>• 다양한 조리법과 팁을 제공합니다</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
