"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { signOut } from "next-auth/react";

import { fetchClientSessionUser } from "@/lib/auth/client-session";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/competitions", label: "比赛列表" },
  { href: "/awards", label: "荣誉展示" },
  { href: "/clubs", label: "五大社团" },
  { href: "/hall-of-fame", label: "名人堂" },
  { href: "/team", label: "网站团队" },
];

interface PortalCurrentUser {
  name: string;
  role: UserRole;
}

interface NewNavbarProps {
  currentUser?: PortalCurrentUser | null;
}

function canAccessAdmin(role: UserRole) {
  return (
    role === "super_admin" ||
    role === "competition_admin" ||
    role === "security_admin" ||
    role === "business_admin" ||
    role === "analytics_viewer" ||
    role === "temporary_admin" ||
    role === "supervisor"
  );
}

export function NewNavbar({ currentUser }: NewNavbarProps) {
  const pathname = usePathname();
  const [clientUser, setClientUser] = useState<PortalCurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const resolvedUser = currentUser === undefined ? clientUser : currentUser;

  const showAdminEntry = resolvedUser ? canAccessAdmin(resolvedUser.role) : false;

  useEffect(() => {
    let active = true;
    if (currentUser !== undefined) {
      return () => {
        active = false;
      };
    }

    void fetchClientSessionUser().then((sessionUser) => {
      if (!active) return;
      if (!sessionUser?.name || !sessionUser.role) {
        setClientUser(null);
        return;
      }
      setClientUser({ name: sessionUser.name, role: sessionUser.role });
    }).catch((error: unknown) => {
      if (active) console.error("[navbar] session unavailable", error);
    });

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function handleSignOut() {
    // Auth.js may return the private API origin through the BFF.
    // Finish cookie invalidation before navigating within the current Web origin.
    await signOut({ redirect: false, callbackUrl: "/" });
    window.location.assign("/");
  }

  function accountLinks() {
    return resolvedUser ? <>
      <span className="max-w-36 truncate text-sm text-slate-600">{resolvedUser.name}</span>
      <Link href="/me" onClick={() => setMenuOpen(false)} className="py-3 text-sm">个人中心</Link>
      {showAdminEntry && <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-3 text-sm">管理台</Link>}
      <button type="button" className="min-h-11 text-sm text-slate-600" onClick={() => void handleSignOut()}>退出登录</button>
    </> : <>
      <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="py-3 text-sm">登录</Link>
      <Button asChild size="sm"><Link href="/competitions" onClick={() => setMenuOpen(false)}>查看比赛</Link></Button>
    </>;
  }
  function navigationLinks(mobile = false) {
    return navLinks.map((link) => {
      const active = pathname === link.href || pathname.startsWith(link.href + "/");
      return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
        className={cn("relative flex min-h-11 items-center whitespace-nowrap text-sm focus-visible:outline-2 focus-visible:outline-blue-600",
          mobile ? "px-3 py-3" : "py-4",
          active ? "font-semibold text-blue-600 after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:bg-blue-600" : "text-slate-600 hover:text-blue-600")}>{link.label}</Link>;
    });
  }
  return <header className="bg-white text-slate-900">
    <div className="mx-auto flex min-h-[68px] max-w-6xl flex-wrap items-center gap-x-6 px-4 py-2 md:px-6">
      <Link href="/" className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-blue-600 text-white"><Trophy className="size-4" aria-hidden="true" /></span>学院竞赛中心
      </Link>
      <nav aria-label="网站导航" className="hidden items-center gap-6 min-[960px]:flex">{navigationLinks()}</nav>
      <div className="ml-auto flex items-center gap-3"><NotificationBell />
        <div className="hidden items-center gap-4 min-[960px]:flex">{accountLinks()}</div>
        <button ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="portal-mobile-menu"
          className="min-h-11 px-2 text-sm min-[960px]:hidden" onClick={() => setMenuOpen(!menuOpen)}>菜单</button>
      </div>
      <div id="portal-mobile-menu" hidden={!menuOpen} className="w-full pb-3 min-[960px]:hidden">
        <nav aria-label="手机网站导航" className="flex flex-col">{navigationLinks(true)}</nav>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-3">{accountLinks()}</div>
      </div>
    </div>
  </header>;
}
