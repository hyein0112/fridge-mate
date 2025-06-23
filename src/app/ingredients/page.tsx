"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingredient, IngredientFormData } from "@/types";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ingredientService } from "@/lib/database";
import { useAuth } from "@/lib/auth-context";
import { resetScrollPosition } from "@/lib/utils";

export default function IngredientsPage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: "",
    quantity: "",
    expiryDate: "",
    category: "",
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadIngredients = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ingredientService.getAllIngredients(user.id);
      setIngredients(data);
    } catch (err) {
      console.error("식재료 로드 실패:", err);
      setError("식재료를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadIngredients();
    }
    // 페이지 로드 시 스크롤 위치 초기화
    resetScrollPosition();
  }, [user, loadIngredients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);

      const ingredientData = {
        name: formData.name.trim(),
        quantity: formData.quantity || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        category: formData.category || undefined,
      };

      if (isEditing) {
        // 수정
        const updatedIngredient = await ingredientService.updateIngredient(isEditing, ingredientData);
        setIngredients((prev) => prev.map((ing) => (ing.id === isEditing ? updatedIngredient : ing)));
        setIsEditing(null);
      } else {
        // 추가
        const newIngredient = await ingredientService.addIngredient(ingredientData, user.id);
        setIngredients((prev) => [...prev, newIngredient]);
      }

      setFormData({ name: "", quantity: "", expiryDate: "", category: "" });
    } catch (err) {
      console.error("식재료 저장 실패:", err);
      alert("식재료 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
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

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const form = e.target as HTMLFormElement;
    const textarea = form.elements.namedItem("bulkIngredients") as HTMLTextAreaElement;
    const ingredientsText = textarea.value.trim();

    if (!ingredientsText) return;

    try {
      setSubmitting(true);

      const ingredientNames = ingredientsText
        .split(/[,\n]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      const newIngredients = await ingredientService.bulkAddIngredients(ingredientNames, user.id);
      setIngredients((prev) => [...prev, ...newIngredients]);
      textarea.value = "";
    } catch (err) {
      console.error("일괄 추가 실패:", err);
      alert("일괄 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">식재료를 등록하려면 로그인해주세요.</p>
          <Link href="/auth">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유통기한</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={submitting}
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

                <Button type="submit" className="w-full" disabled={submitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {submitting ? "저장 중..." : isEditing ? "수정하기" : "추가하기"}
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
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={submitting}>
                  {submitting ? "추가 중..." : "일괄 추가"}
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
              <div className="text-center py-8">
                <p className="text-gray-500">등록된 식재료가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {ingredients.map((ingredient) => {
                  const expiryStatus = ingredient.expiryDate
                    ? isExpired(ingredient.expiryDate)
                      ? "expired"
                      : isExpiringSoon(ingredient.expiryDate)
                      ? "expiring"
                      : "good"
                    : null;

                  return (
                    <div
                      key={ingredient.id}
                      className={`p-3 sm:p-4 border rounded-lg ${
                        expiryStatus === "expired"
                          ? "bg-red-50 border-red-200"
                          : expiryStatus === "expiring"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{ingredient.name}</h3>
                          {ingredient.quantity && <p className="text-sm text-gray-500">{ingredient.quantity}</p>}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ingredient)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ingredient.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        {ingredient.category && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{ingredient.category}</span>}
                        {expiryStatus && (
                          <span
                            className={`px-2 py-1 rounded ${
                              expiryStatus === "expired"
                                ? "text-red-600 bg-red-100"
                                : expiryStatus === "expiring"
                                ? "text-yellow-600 bg-yellow-100"
                                : "text-green-600 bg-green-100"
                            }`}
                          >
                            {expiryStatus === "expired" ? "만료됨" : expiryStatus === "expiring" ? "임박" : "양호"}
                          </span>
                        )}
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
