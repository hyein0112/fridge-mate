"use client";
import { useEffect, useState } from "react";
import { Recipe, RecipeIngredient } from "@/types";
import RecipeCard from "./recipe-card";
import { useRouter } from "next/navigation";

interface RecipeListProps {
  myIngredients?: { name: string }[];
}

export default function RecipeList({ myIngredients = [] }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/recipes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩중...</div>;
  if (recipes.length === 0) return <div>등록된 레시피가 없습니다.</div>;

  // 내 식재료 이름만 추출 (소문자 비교용)
  const myIngredientNames = myIngredients.map((ing) => ing.name?.trim().toLowerCase()).filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {recipes.map((recipe) => {
        let missing: string[] | undefined = undefined;
        if (myIngredients && myIngredients.length > 0) {
          const ingredientsArr = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : (() => {
                try {
                  return JSON.parse(recipe.ingredients || "[]");
                } catch {
                  return [];
                }
              })();
          missing = (ingredientsArr as RecipeIngredient[])
            .map((ri) => ri.name?.trim())
            .filter((name) => name && !myIngredientNames.includes(name.toLowerCase())) as string[];
        }
        return (
          <RecipeCard key={recipe.id} recipe={recipe} missingIngredients={missing} onClick={() => router.push(`/recipe/${recipe.id}`)} />
        );
      })}
    </div>
  );
}
