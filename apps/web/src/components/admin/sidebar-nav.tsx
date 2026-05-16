"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  GitMerge,
  BarChart3,
  Trash2,
  Users,
  Clock,
  ScrollText,
  Archive,
  Mail,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@lf/shared";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    labelKey: "dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/items",
    labelKey: "items",
    icon: Package,
    roles: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/claims",
    labelKey: "claims",
    icon: ClipboardList,
    roles: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/matches",
    labelKey: "matches",
    icon: GitMerge,
    roles: [UserRole.OPERATOR, UserRole.ADMIN],
  },
  {
    href: "/admin/analytics",
    labelKey: "analytics",
    icon: BarChart3,
    roles: [UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/archive",
    labelKey: "archive",
    icon: Archive,
    roles: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/disposals",
    labelKey: "disposals",
    icon: Trash2,
    roles: [UserRole.ADMIN],
  },
  {
    href: "/admin/settings/users",
    labelKey: "users",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    href: "/admin/settings/retention",
    labelKey: "retention",
    icon: Clock,
    roles: [UserRole.ADMIN],
  },
  {
    href: "/admin/settings/templates",
    labelKey: "templates",
    icon: Mail,
    roles: [UserRole.ADMIN],
  },
  {
    href: "/admin/settings/subscriptions",
    labelKey: "subscriptions",
    icon: Bell,
    roles: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN],
  },
  {
    href: "/admin/settings/audit",
    labelKey: "audit",
    icon: ScrollText,
    roles: [UserRole.ADMIN],
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const role = user?.role;
  const t = useTranslations("nav");

  const items = role
    ? ADMIN_NAV.filter((item) => item.roles.includes(role))
    : ADMIN_NAV;

  return (
    <ul className="space-y-0.5 px-3">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-stone-900 text-white"
                  : "text-stone-700 hover:bg-stone-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
