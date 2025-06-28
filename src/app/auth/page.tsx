"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // user가 있으면 자동으로 메인으로 이동
  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isLogin) {
      // 회원가입
      if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("비밀번호는 최소 6자 이상이어야 합니다.");
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setError("");
      }
    } else {
      // 로그인
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  if (success) {
    return (
      <div style={{ minHeight: "calc(100vh - 64px)" }} className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">회원가입 완료!</CardTitle>
              <CardDescription className="text-center">이메일을 확인하여 계정을 활성화해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {email}로 확인 이메일을 보냈습니다. 이메일의 링크를 클릭하여 계정을 활성화하세요.
              </p>
              <Button className="bg-white text-gray-900 border" onClick={() => setIsLogin(true)}>
                로그인하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)" }} className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">FridgeMate {isLogin ? "로그인" : "회원가입"}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">냉장고 속 재료로 맛있는 요리를 만들어보세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "로그인" : "회원가입"}</CardTitle>
            <CardDescription>{isLogin ? "이메일과 비밀번호로 로그인하세요" : "이메일과 비밀번호로 회원가입하세요"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={isLogin ? "비밀번호를 입력하세요" : "비밀번호를 입력하세요 (최소 6자)"}
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                </div>
              )}

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <Button type="submit" disabled={loading} className="w-full mt-4 bg-white text-gray-900 border">
                {loading ? (isLogin ? "로그인 중..." : "회원가입 중...") : isLogin ? "로그인" : "회원가입"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
                <button onClick={toggleMode} className="font-medium text-indigo-600 hover:text-indigo-500">
                  {isLogin ? "회원가입" : "로그인"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
