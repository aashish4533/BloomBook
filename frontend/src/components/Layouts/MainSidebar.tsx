"use client";

import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Store,
  Calendar,
  ArrowLeftRight,
  Users,
  GraduationCap,
  Wallet,
  Heart,
  FileText,
  LogOut,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { auth } from "../../firebase";
import { useUserRole } from "../../context/UserRoleContext";

// Type definitions for navigation items
interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export interface MainSidebarProps {
  onLogout?: () => void;
  className?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function MainSidebar({
  onLogout,
  className,
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose
}: MainSidebarProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { isAdmin } = useUserRole();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        onMobileClose();
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Navigation configuration - Memoized to react to isAdmin
  const navigationSections: NavSection[] = useMemo(() => [
    {
      label: "Discover",
      items: [
        { title: "Marketplace", path: "/marketplace", icon: Store },
        { title: "Rentals", path: "/rent", icon: Calendar },
        { title: "Exchanges", path: "/exchange", icon: ArrowLeftRight },
      ],
    },
    {
      label: "Social",
      items: [
        { title: "Communities", path: "/communities", icon: Users },
        { title: "Tuition Hub", path: "/tuition", icon: GraduationCap },
      ],
    },
    {
      label: "Personal",
      items: [
        { title: "My Wallet", path: "/dashboard/wallet", icon: Wallet },
        // Conditionally add Wishlist
        ...(isAdmin ? [{ title: "Wishlist", path: "/wishlist", icon: Heart }] : []),
        { title: "My Notes", path: "/notes", icon: FileText },
      ],
    },
  ], [isAdmin]);

  // Get current user info
  const user = auth.currentUser;
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check if a path is currently active
  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  // Handle navigation click (close mobile sidebar)
  const handleNavClick = () => {
    if (isMobile) {
      onMobileClose();
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      // logic handled by parent or different trigger usually
    } else {
      onToggle();
    }
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <>


      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 flex flex-col",
          "bg-gradient-to-b from-[#FAF8F3] via-[#FAF8F3] to-[#F5F0E8]",
          "border-r border-[#C4A672]/20",
          "shadow-xl",
          "transition-all duration-300 ease-in-out",
          // Desktop behavior
          "hidden md:flex",
          sidebarWidth,
          className
        )}
      >
        {/* Gradient border effect */}
        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-[#C4A672]/50 via-[#C4A672]/30 to-[#2C3E50]/20" />

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <Link
            to="/"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 group",
              isCollapsed && "justify-center"
            )}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2C3E50] to-[#1a252f] shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#C4A672] animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#2C3E50] tracking-tight">
                  BookBloom
                </span>
                <span className="text-xs text-[#8B7355] font-medium">
                  Discover • Share • Learn
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#2C3E50] text-white flex items-center justify-center shadow-md hover:bg-[#1a252f] transition-colors z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Separator */}
        <div className="mx-3 h-[1px] bg-gradient-to-r from-transparent via-[#C4A672]/30 to-transparent" />

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label} className="mb-6">
              {/* Section Label */}
              {!isCollapsed && (
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B7355]/70">
                  {section.label}
                </div>
              )}

              {/* Section Items */}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isActivePath(item.path);
                  const Icon = item.icon;

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={handleNavClick}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "transition-all duration-200",
                          "group",
                          isCollapsed && "justify-center",
                          isActive
                            ? "bg-gradient-to-r from-[#C4A672]/25 to-[#C4A672]/10 text-[#2C3E50] font-medium shadow-sm"
                            : "text-[#5a5a5a] hover:bg-[#C4A672]/10 hover:text-[#2C3E50]"
                        )}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#C4A672] to-[#8B7355] shadow-[0_0_8px_rgba(196,166,114,0.6)]" />
                        )}

                        <Icon
                          className={cn(
                            "w-5 h-5 transition-colors duration-200",
                            isActive
                              ? "text-[#C4A672]"
                              : "text-[#8B7355] group-hover:text-[#C4A672]"
                          )}
                        />

                        {!isCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Section separator */}
              {sectionIndex < navigationSections.length - 1 && !isCollapsed && (
                <div className="mt-4 mx-3 h-[1px] bg-gradient-to-r from-transparent via-[#C4A672]/20 to-transparent" />
              )}
            </div>
          ))}
        </nav>

        {/* Separator */}
        <div className="mx-3 h-[1px] bg-gradient-to-r from-transparent via-[#C4A672]/30 to-transparent" />

        {/* User Profile Footer */}
        <div className="p-3">
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              "bg-gradient-to-r from-[#2C3E50]/5 to-[#C4A672]/5",
              "border border-[#C4A672]/10",
              isCollapsed && "justify-center p-2"
            )}
          >
            {/* User Avatar */}
            <Avatar
              className={cn(
                "border-2 border-[#C4A672]/30 shadow-md",
                isCollapsed ? "w-8 h-8" : "w-10 h-10"
              )}
            >
              <AvatarImage src={user?.photoURL || undefined} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-[#C4A672] to-[#8B7355] text-white font-semibold text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C3E50] truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-[#8B7355] truncate">{userEmail}</p>
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    className="h-8 w-8 rounded-lg text-[#8B7355] hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>


    </>
  );
}

// Export a hook to control the sidebar from other components
export function useSidebarControl() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default MainSidebar;
