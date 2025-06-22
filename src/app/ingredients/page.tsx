"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingredient, IngredientFormData } from "@/types";
import { generateId } from "@/lib/utils";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: "",
    quantity: "",
    expiryDate: "",
    category: "",
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const newIngredient: Ingredient = {
      id: isEditing || generateId(),
      name: formData.name.trim(),
      quantity: formData.quantity || undefined,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      category: formData.category || undefined,
      createdAt: new Date(),
    };

    if (isEditing) {
      setIngredients((prev) => prev.map((ing) => (ing.id === isEditing ? newIngredient : ing)));
      setIsEditing(null);
    } else {
      setIngredients((prev) => [...prev, newIngredient]);
    }

    setFormData({ name: "", quantity: "", expiryDate: "", category: "" });
  };

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({
      name: ingredient.name,
      quantity: ingredient.quantity || "",
      expiryDate: ingredient.expiryDate ? ingredient.expiryDate.toISOString().split("T")[0] : "",
      category: ingredient.category || "",
    });
    setIsEditing(ingredient.id);
  };

  const handleDelete = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.elements.namedItem("bulkIngredients") as HTMLTextAreaElement;
    const ingredientsText = textarea.value.trim();

    if (!ingredientsText) return;

    const ingredientNames = ingredientsText
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const newIngredients: Ingredient[] = ingredientNames.map((name) => ({
      id: generateId(),
      name,
      createdAt: new Date(),
    }));

    setIngredients((prev) => [...prev, ...newIngredients]);
    textarea.value = "";
  };

  const isExpiringSoon = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isExpired = (date: Date) => {
    return date < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">식재료 등록</h1>
          <p className="text-sm sm:text-base text-gray-600">현재 보유한 식재료를 등록하고 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* 식재료 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>식재료 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">식재료명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 감자, 양파, 계란"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 3개, 500g"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유통기한</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="야채">야채</option>
                    <option value="육류">육류</option>
                    <option value="유제품">유제품</option>
                    <option value="곡물">곡물</option>
                    <option value="조미료">조미료</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditing ? "수정하기" : "추가하기"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 일괄 추가 */}
          <Card>
            <CardHeader>
              <CardTitle>일괄 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">식재료 목록</label>
                  <textarea
                    name="bulkIngredients"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="여러 식재료를 콤마(,) 또는 줄바꿈으로 구분하여 입력하세요&#10;예: 감자, 양파&#10;계란, 돼지고기"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  일괄 추가
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 식재료 리스트 */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>등록된 식재료 ({ingredients.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredients.length === 0 ? (
              <p className="text-gray-500 text-center py-8">등록된 식재료가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 ${
                      ingredient.expiryDate && isExpired(ingredient.expiryDate)
                        ? "bg-red-50 border-red-200"
                        : ingredient.expiryDate && isExpiringSoon(ingredient.expiryDate)
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{ingredient.name}</h3>
                        {ingredient.quantity && <span className="text-sm text-gray-500">({ingredient.quantity})</span>}
                        {ingredient.category && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{ingredient.category}</span>
                        )}
                      </div>
                      {ingredient.expiryDate && (
                        <p
                          className={`text-sm ${
                            isExpired(ingredient.expiryDate)
                              ? "text-red-600"
                              : isExpiringSoon(ingredient.expiryDate)
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}
                        >
                          유통기한: {ingredient.expiryDate.toLocaleDateString("ko-KR")}
                          {isExpired(ingredient.expiryDate) && " (만료됨)"}
                          {isExpiringSoon(ingredient.expiryDate) && !isExpired(ingredient.expiryDate) && " (임박)"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(ingredient)} className="flex-1 sm:flex-none">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ingredient.id)}
                        className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
