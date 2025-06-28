"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, ChefHat, Mail, Trash2, Eye, Shield, AlertTriangle } from "lucide-react";

// 관리자 이메일 목록 (실제 운영 시에는 환경변수나 데이터베이스에서 관리)
const ADMIN_EMAILS = ["bhi12134@gmail.com"]; // 여기에 관리자 이메일 추가

interface Recipe {
  id: string;
  name: string;
  created_by: string;
  author_email?: string;
  created_at: string;
  difficulty: string;
  cooking_time: number;
  servings: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [users, setUsers] = useState<User[]>([]);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 레시피 데이터 가져오기 (author_email 포함)
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("id, name, created_by, author_email, created_at, difficulty, cooking_time, servings")
        .order("created_at", { ascending: false });

      if (recipesError) {
        console.error("레시피 데이터 로드 오류:", recipesError);
        // 오류가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setRecipes([]);
      } else {
        setRecipes(recipesData || []);
      }

      // 사용자 통계 (레시피 작성자 기준으로 추정)
      const uniqueUsers = new Set(recipesData?.map((recipe) => recipe.created_by) || []);

      setStats({
        totalRecipes: recipesData?.length || 0,
        totalUsers: uniqueUsers.size,
        activeUsers: uniqueUsers.size, // 레시피를 작성한 사용자를 활성 사용자로 간주
      });
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch {
      setUsers([]);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm("정말로 이 레시피를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

      if (error) {
        console.error("레시피 삭제 오류:", error);
        alert("레시피 삭제에 실패했습니다.");
      } else {
        setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
        setStats((prev) => ({ ...prev, totalRecipes: prev.totalRecipes - 1 }));
        alert("레시피가 삭제되었습니다.");
      }
    } catch (error) {
      console.error("레시피 삭제 오류:", error);
      alert("레시피 삭제에 실패했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatUserId = (userId: string) => {
    // UUID를 더 읽기 쉽게 표시 (앞 8자리만)
    if (userId && userId.length > 8) {
      return `${userId.substring(0, 8)}...`;
    }
    return userId;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              접근 권한 없음
            </CardTitle>
            <CardDescription className="text-center">로그인이 필요합니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              관리자 권한 필요
            </CardTitle>
            <CardDescription className="text-center">이 페이지에 접근할 권한이 없습니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Shield className="h-8 w-8 inline mr-2" />
            관리자 대시보드
          </h1>
          <p className="text-gray-600">FridgeMate 시스템 관리</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">레시피 작성자 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 레시피</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">등록된 레시피 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">정상</div>
              <p className="text-xs text-muted-foreground">모든 시스템 정상 작동</p>
            </CardContent>
          </Card>
        </div>

        {/* 유저 목록 카드 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>전체 유저 목록</CardTitle>
            <CardDescription>가입된 모든 유저의 이메일, 가입일, 최근 로그인일을 확인할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">이메일</th>
                    <th className="px-4 py-2 text-left">가입일</th>
                    <th className="px-4 py-2 text-left">최근 로그인</th>
                    <th className="px-4 py-2 text-left">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-2">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "-"}</td>
                      <td className="px-4 py-2">{formatUserId(user.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="text-gray-500 py-4">유저가 없습니다.</div>}
            </div>
          </CardContent>
        </Card>

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="recipes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="recipes" className="flex items-center space-x-2">
              <ChefHat className="h-4 w-4" />
              <span>레시피 관리</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>레시피 목록</CardTitle>
                <CardDescription>등록된 모든 레시피를 관리할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">레시피명</th>
                        <th className="text-left py-2">작성자</th>
                        <th className="text-left py-2">등록일</th>
                        <th className="text-left py-2">난이도</th>
                        <th className="text-left py-2">조리시간</th>
                        <th className="text-left py-2">인분</th>
                        <th className="text-left py-2">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.map((recipe) => (
                        <tr key={recipe.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium">{recipe.name}</td>
                          <td className="py-2">
                            <div className="space-y-1">
                              {recipe.author_email ? (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{recipe.author_email}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{formatUserId(recipe.created_by)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2">{formatDate(recipe.created_at)}</td>
                          <td className="py-2">
                            <Badge className={getDifficultyColor(recipe.difficulty)}>
                              {recipe.difficulty === "easy" ? "쉬움" : recipe.difficulty === "medium" ? "보통" : "어려움"}
                            </Badge>
                          </td>
                          <td className="py-2">{recipe.cooking_time}분</td>
                          <td className="py-2">{recipe.servings}인분</td>
                          <td className="py-2">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/recipe/${recipe.id}`, "_blank")}
                                className="bg-white text-gray-900 border"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteRecipe(recipe.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
