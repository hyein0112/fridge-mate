"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingredient } from "@/types";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// 임시 데이터
const mockIngredients: Ingredient[] = [
  {
    id: "1",
    name: "감자",
    quantity: "3개",
    category: "야채",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "양파",
    quantity: "2개",
    category: "야채",
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "계란",
    quantity: "6개",
    category: "유제품",
    expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전 (만료)
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "돼지고기",
    quantity: "300g",
    category: "육류",
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일 후
    createdAt: new Date(),
  },
];

export default function MyIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "야채", "육류", "유제품", "곡물", "조미료", "기타"];

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

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 식재료를 삭제하시겠습니까?")) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    }
  };

  const expiringIngredients = ingredients.filter((ing) => ing.expiryDate && (isExpiringSoon(ing.expiryDate) || isExpired(ing.expiryDate)));

  const expiredIngredients = ingredients.filter((ing) => ing.expiryDate && isExpired(ing.expiryDate));

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
              <p className="text-gray-500 text-center py-8">해당 카테고리의 식재료가 없습니다.</p>
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

                      <div className="flex items-center justify-between mb-2">
                        {ingredient.category && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{ingredient.category}</span>
                        )}

                        {expiryStatus && (
                          <span className={`px-2 py-1 text-xs rounded-full ${expiryStatus.color}`}>{expiryStatus.text}</span>
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
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 유통기한 임박 알림 */}
        {expiringIngredients.length > 0 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 text-lg">⚠️ 유통기한 임박 알림</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-yellow-200 gap-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ingredient.name}</p>
                      <p className="text-sm text-yellow-700">
                        유통기한: {ingredient.expiryDate?.toLocaleDateString("ko-KR")}
                        {isExpired(ingredient.expiryDate!) && " (만료됨)"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
