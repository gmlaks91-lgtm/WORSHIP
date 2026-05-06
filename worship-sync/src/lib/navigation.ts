import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarDays, HeartPulse, LayoutList, MessagesSquare, MoreHorizontal, ShoppingBag, Users } from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", label: "송리스트", icon: LayoutList },
  { href: "/sheets", label: "악보", icon: BookOpen },
  { href: "/schedule", label: "일정", icon: CalendarDays },
  { href: "/faith", label: "신앙", icon: HeartPulse },
  { href: "/shop", label: "상점", icon: ShoppingBag },
  { href: "/team", label: "팀", icon: Users },
  { href: "/board", label: "게시판", icon: MessagesSquare },
  { href: "/more", label: "더보기", icon: MoreHorizontal },
];
