"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Dumbbell,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
  { label: "Routines", href: "/dashboard/routines", icon: ListChecks },
  { label: "Posts", href: "/dashboard/posts", icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 shrink-0 items-center justify-center border-b border-sidebar-border overflow-hidden px-4">
        <Link href="/dashboard" className="relative flex h-8 items-center justify-center">
          <Image
            src="/Logo.png"
            alt="Hylift"
            width={120}
            height={32}
            className="h-8 w-auto transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0"
          />
          <Image
            src="/icon.png"
            alt="Hylift"
            width={1128}
            height={2118}
            className="absolute h-auto w-10 opacity-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-100"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
