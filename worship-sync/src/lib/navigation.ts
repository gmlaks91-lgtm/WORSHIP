import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarDays, LayoutList, MessagesSquare, MoreHorizontal, Users } from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", label: "Setlists", icon: LayoutList },
  { href: "/sheets", label: "Sheets", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/team", label: "Team", icon: Users },
  { href: "/board", label: "Board", icon: MessagesSquare },
  { href: "/more", label: "More", icon: MoreHorizontal },
];
