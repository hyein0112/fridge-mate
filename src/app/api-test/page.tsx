"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { aiService } from "@/lib/ai-service";

interface TestResult {
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const testAPIKey = () => {
    const key = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    if (key) {
      setApiKey(key.startsWith("pplx-") ? "✅ Valid API Key" : "❌ Invalid API Key Format");
    } else {
      setApiKey("❌ API Key Not Found");
    }
  };

  const testRecipeGeneration = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateRecipe({
        ingredients: ["감자", "양파", "계란"],
        difficulty: "easy",
        servings: 2,
      });

      setTestResults((prev) => [
        ...prev,
        {
          type: "Recipe Generation",
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        {
          type: "Recipe Generation",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const testSeasonalIngredients = async () => {
    setLoading(true);
    try {
      const result = await aiService.getSeasonalIngredients();

      setTestResults((prev) => [
        ...prev,
        {
          type: "Seasonal Ingredients",
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        {
          type: "Seasonal Ingredients",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const testCookingTips = async () => {
    setLoading(true);
    try {
      const result = await aiService.getCookingTips("감자");

      setTestResults((prev) => [
        ...prev,
        {
          type: "Cooking Tips",
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        {
          type: "Cooking Tips",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Perplexity API 테스트</h1>
          <p className="text-sm sm:text-base text-gray-600">퍼플렉시티 AI API 연동 상태를 확인하고 테스트해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* API 키 확인 */}
          <Card>
            <CardHeader>
              <CardTitle>API 키 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">API 키 확인:</p>
                  <p className="text-sm text-gray-600">{apiKey || "아직 확인하지 않음"}</p>
                </div>
                <Button onClick={testAPIKey} variant="outline" className="w-full">
                  API 키 확인
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 테스트 버튼들 */}
          <Card>
            <CardHeader>
              <CardTitle>API 기능 테스트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button onClick={testRecipeGeneration} disabled={loading} className="w-full">
                  {loading ? "테스트 중..." : "레시피 생성 테스트"}
                </Button>

                <Button onClick={testSeasonalIngredients} disabled={loading} variant="outline" className="w-full">
                  {loading ? "테스트 중..." : "계절별 식재료 테스트"}
                </Button>

                <Button onClick={testCookingTips} disabled={loading} variant="outline" className="w-full">
                  {loading ? "테스트 중..." : "요리 팁 테스트"}
                </Button>

                <Button onClick={clearResults} variant="destructive" className="w-full">
                  결과 초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>테스트 결과 ({testResults.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{result.type}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.success ? "성공" : "실패"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">{result.timestamp}</p>

                    {result.success ? (
                      <div className="text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap bg-white p-2 rounded border">{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p className="font-medium">오류:</p>
                        <p>{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용법 안내 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>퍼플렉시티 API 설정 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. API 키 획득</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>
                    <a
                      href="https://www.perplexity.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Perplexity AI
                    </a>
                    에 가입
                  </li>
                  <li>API 섹션에서 API 키 생성</li>
                  <li>API 키는 &quot;pplx-&quot;로 시작해야 함</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. 환경 변수 설정</h4>
                <p className="text-gray-600 mb-2">
                  프로젝트 루트의 <code className="bg-gray-100 px-1 rounded">.env.local</code> 파일에 추가:
                </p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {`NEXT_PUBLIC_PERPLEXITY_API_KEY=pplx-your-api-key-here`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. 사용량 확인</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>무료 티어: 월 5회 요청</li>
                  <li>유료 플랜: $5/월부터</li>
                  <li>API 대시보드에서 사용량 확인 가능</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
