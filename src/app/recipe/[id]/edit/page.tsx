"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Recipe } from "@/types";
import { recipeService } from "@/lib/database";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface Ingredient {
  name: string;
  quantity: string;
  isAvailable: boolean;
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState("");
  const [cookingTime, setCookingTime] = useState(30);
  const [servings, setServings] = useState(2);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [image, setImage] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    if (params.id) {
      loadRecipe(params.id as string);
    }
  }, [params.id]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const recipes = await recipeService.getAllRecipes();
      const foundRecipe = recipes.find((r) => r.id === recipeId);

      if (foundRecipe) {
        setRecipe(foundRecipe);
        setName(foundRecipe.name);
        setCookingTime(foundRecipe.cookingTime);
        setServings(foundRecipe.servings);
        setDifficulty(foundRecipe.difficulty);
        setImage(foundRecipe.image || "");
        setIngredients(
          foundRecipe.ingredients.map((ing) => ({
            name: ing.name || "",
            quantity: ing.quantity,
            isAvailable: ing.isAvailable,
          }))
        );
        setInstructions(foundRecipe.instructions);
        setTags(foundRecipe.tags || []);
        setTips(foundRecipe.tips || []);
      } else {
        setError("레시피를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("레시피 로드 실패:", err);
      setError("레시피를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !recipe) return;

    try {
      setSaving(true);
      setError(null);

      const updatedRecipe: Recipe = {
        ...recipe,
        name,
        cookingTime,
        servings,
        difficulty,
        image,
        ingredients,
        instructions,
        tags,
        tips,
        updatedAt: new Date(),
      };

      await recipeService.updateRecipe(recipe.id, updatedRecipe, user.id);
      router.push(`/recipe/${recipe.id}`);
    } catch (err) {
      console.error("레시피 수정 실패:", err);
      setError("레시피 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", isAvailable: true }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | boolean) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setIngredients(updatedIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = value;
    setInstructions(updatedInstructions);
  };

  const addTag = () => {
    setTags([...tags, ""]);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index: number, value: string) => {
    const updatedTags = [...tags];
    updatedTags[index] = value;
    setTags(updatedTags);
  };

  const addTip = () => {
    setTips([...tips, ""]);
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const updateTip = (index: number, value: string) => {
    const updatedTips = [...tips];
    updatedTips[index] = value;
    setTips(updatedTips);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "레시피를 찾을 수 없습니다."}</p>
          <Link href="/">
            <Button variant="outline">메인으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 작성자만 수정 가능
  if (recipe.createdBy !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">이 레시피를 수정할 권한이 없습니다.</p>
          <Link href={`/recipe/${recipe.id}`}>
            <Button variant="outline">레시피로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/recipe/${recipe.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            레시피로 돌아가기
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">레시피 수정</h1>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">레시피 이름</label>
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="레시피 이름을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">조리 시간 (분)</label>
                  <Input
                    type="number"
                    value={cookingTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCookingTime(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">인분</label>
                  <Input
                    type="number"
                    value={servings}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServings(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                  <select
                    value={difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지 URL</label>
                <Input
                  value={image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImage(e.target.value)}
                  placeholder="이미지 URL을 입력하세요"
                />
              </div>
            </CardContent>
          </Card>

          {/* 재료 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                재료
                <Button onClick={addIngredient} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  재료 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Input
                      value={ingredient.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateIngredient(index, "name", e.target.value)}
                      placeholder="재료명"
                      className="flex-1"
                    />
                    <Input
                      value={ingredient.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateIngredient(index, "quantity", e.target.value)}
                      placeholder="수량"
                      className="w-32"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ingredient.isAvailable}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateIngredient(index, "isAvailable", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">보유</span>
                    </label>
                    <Button onClick={() => removeIngredient(index)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 조리법 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                조리법
                <Button onClick={addInstruction} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  단계 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mt-2">
                      {index + 1}
                    </div>
                    <Textarea
                      value={instruction}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateInstruction(index, e.target.value)}
                      placeholder={`${index + 1}단계 조리법을 입력하세요`}
                      className="flex-1"
                      rows={3}
                    />
                    <Button
                      onClick={() => removeInstruction(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 mt-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 태그 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                태그
                <Button onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  태그 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tags.map((tag, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Input
                      value={tag}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTag(index, e.target.value)}
                      placeholder="태그를 입력하세요"
                      className="flex-1"
                    />
                    <Button onClick={() => removeTag(index)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 조리 팁 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                조리 팁
                <Button onClick={addTip} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />팁 추가
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <Textarea
                      value={tip}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTip(index, e.target.value)}
                      placeholder="조리 팁을 입력하세요"
                      className="flex-1"
                      rows={2}
                    />
                    <Button onClick={() => removeTip(index)} variant="outline" size="sm" className="text-red-600 hover:text-red-700 mt-2">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
