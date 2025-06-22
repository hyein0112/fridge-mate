"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingredient } from "@/types";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ingredientService } from "@/lib/database";

export default function MyIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 임시 사용자 ID (나중에 인증 시스템으로 교체)
  const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

  const categories = ["all", "야채", "육류", "유제품", "곡물", "조미료", "기타"];

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ingredientService.getAllIngredients(TEMP_USER_ID);
      setIngredients(data);
    } catch (err) {
      console.error("식재료 로드 실패:", err);
      setError("식재료를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = selectedCategory === "all" ? ingredients : ingredients.filter((ing) => ing.category === selectedCategory);

  const isExpiringSoon = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isExpired = (date: Date) => {
    return date < new Date();
  };

  const getExpiryStatus = (date: Date) => {
    if (isExpired(date)) return { status: "expired", text: "만료됨", color: "text-red-600 bg-red-100" };
    if (isExpiringSoon(date)) return { status: "expiring", text: "임박", color: "text-yellow-600 bg-yellow-100" };
    return { status: "good", text: "양호", color: "text-green-600 bg-green-100" };
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말로 이 식재료를 삭제하시겠습니까?")) {
      try {
        await ingredientService.deleteIngredient(id);
        setIngredients((prev) => prev.filter((ing) => ing.id !== id));
      } catch (err) {
        console.error("삭제 실패:", err);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const expiringIngredients = ingredients.filter((ing) => ing.expiryDate && (isExpiringSoon(ing.expiryDate) || isExpired(ing.expiryDate)));

  const expiredIngredients = ingredients.filter((ing) => ing.expiryDate && isExpired(ing.expiryDate));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">식재료를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadIngredients} variant="outline">
            다시 시도
          </Button>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">내 식재료</h1>
          <p className="text-sm sm:text-base text-gray-600">보유한 식재료를 관리하고 유통기한을 확인하세요</p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 식재료</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{ingredients.length}개</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg sm:text-xl">📦</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">유통기한 임박</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{expiringIngredients.length}개</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg sm:text-xl">⚠️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">만료된 식재료</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{expiredIngredients.length}개</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg sm:text-xl">🚫</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 액션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700">카테고리:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "전체" : category}
                </option>
              ))}
            </select>
          </div>

          <Link href="/ingredients" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              식재료 추가
            </Button>
          </Link>
        </div>

        {/* 식재료 리스트 */}
        <Card>
          <CardHeader>
            <CardTitle>식재료 목록 ({filteredIngredients.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {selectedCategory === "all" ? "등록된 식재료가 없습니다." : `${selectedCategory} 카테고리의 식재료가 없습니다.`}
                </p>
                {selectedCategory === "all" && (
                  <Link href="/ingredients">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />첫 식재료 추가하기
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredIngredients.map((ingredient) => {
                  const expiryStatus = ingredient.expiryDate ? getExpiryStatus(ingredient.expiryDate) : null;

                  return (
                    <div
                      key={ingredient.id}
                      className={`p-3 sm:p-4 border rounded-lg ${
                        ingredient.expiryDate && isExpired(ingredient.expiryDate)
                          ? "bg-red-50 border-red-200"
                          : ingredient.expiryDate && isExpiringSoon(ingredient.expiryDate)
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{ingredient.name}</h3>
                          {ingredient.quantity && <p className="text-sm text-gray-500">{ingredient.quantity}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ingredient.id)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        {ingredient.category && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{ingredient.category}</span>}
                        {expiryStatus && <span className={`px-2 py-1 rounded ${expiryStatus.color}`}>{expiryStatus.text}</span>}
                      </div>

                      {ingredient.expiryDate && (
                        <p className="text-xs text-gray-500 mt-2">유통기한: {ingredient.expiryDate.toLocaleDateString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
