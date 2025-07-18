"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeCardProps } from "@/types";
import { formatTime, getDifficultyText, getDifficultyColor, cn } from "@/lib/utils";
import { Clock, ChefHat, AlertTriangle } from "lucide-react";
import Image from "next/image";

const RecipeCard = ({ recipe, missingIngredients, onClick }: RecipeCardProps) => {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">{recipe.name}</CardTitle>
          <span className={cn("px-2 py-1 text-xs font-medium rounded-full flex-shrink-0", getDifficultyColor(recipe.difficulty))}>
            {getDifficultyText(recipe.difficulty)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {recipe.image && (
          <div className="mb-4">
            <Image src={recipe.image} alt={recipe.name} width={256} height={128} className="w-full h-32 sm:h-48 object-cover rounded-lg" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(recipe.cooking_time)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChefHat className="h-4 w-4" />
              <span>{recipe.servings}인분</span>
            </div>
          </div>

          {Array.isArray(missingIngredients) && missingIngredients.length > 0 && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm flex-1">
                <p className="font-medium text-yellow-800 mb-1">부족한 재료:</p>
                <p className="text-yellow-700 break-words">{missingIngredients.join(", ")}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
