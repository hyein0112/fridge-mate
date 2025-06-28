"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChefHat, Plus, List, Home, Menu, X, User, LogOut, Shield, Search, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 관리자 이메일 목록
const ADMIN_EMAILS = ["bhi12134@gmail.com"];

const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { user, signOut, loading } = useAuth();

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  // 주요 네비게이션 아이템 (항상 표시)
  const mainNavItems = [{ href: "/", label: "홈", icon: Home }];

  // 드롭다운 메뉴 아이템 (더 많은 옵션)
  const dropdownNavItems = [
    { href: "/recipe/new", label: "레시피 등록", icon: Plus },
    { href: "/ingredients", label: "식재료 등록", icon: List },
    { href: "/my-ingredients", label: "내 식재료", icon: List },
  ];

  // 관리자인 경우 어드민 페이지 추가
  if (isAdmin) {
    dropdownNavItems.push({ href: "/admin", label: "관리자", icon: Shield });
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900 ml-2">FridgeMate</span>
            </div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">FridgeMate</span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden lg:flex items-center space-x-4">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* 검색 버튼 (데스크톱) */}
            <button
              onClick={() => router.push("/search")}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            >
              <Search className="h-4 w-4" />
              <span>검색</span>
            </button>

            {/* 더보기 드롭다운 */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                <MoreHorizontal className="h-4 w-4" />
                <span>메뉴</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {dropdownNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600",
                          isActive && "bg-orange-50 text-orange-600"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 인증 상태에 따른 버튼 */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="hidden xl:block">{user.email}</span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-white text-gray-900 border"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">로그아웃</span>
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="bg-white text-gray-900 border">
                  로그인
                </Button>
              </Link>
            )}
          </div>

          {/* 모바일 오른쪽 아이콘 그룹 */}
          <div className="flex items-center lg:hidden">
            {/* 검색 버튼 (모바일) */}
            <button onClick={() => router.push("/search")} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Search className="h-6 w-6" />
            </button>
            {/* 햄버거 메뉴 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* 데스크톱 검색창 */}
        {showSearch && (
          <div className="hidden lg:block border-t border-gray-200 bg-white px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="레시피 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {/* 모바일 검색창 */}
        {showSearch && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="레시피 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white z-50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                      isActive ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* 구분선 */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* 추가 메뉴 아이템 */}
              {dropdownNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                      isActive ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* 모바일 인증 메뉴 */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600">
                      <User className="h-5 w-5" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 w-full bg-white"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-orange-600 hover:bg-orange-50"
                    >
                      <User className="h-5 w-5" />
                      <span>로그인/회원가입</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
