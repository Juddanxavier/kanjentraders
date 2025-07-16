"use client"
import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUserPlus,
  IconPackage,
  IconTruck,
  IconChartBar,
  IconMail,
  IconBell,
  IconKey,
  IconShieldCheck,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Leads",
      url: "/admin/leads",
      icon: IconUserPlus,
    },
    {
      title: "Shipments",
      url: "/admin/shipments",
      icon: IconTruck,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
    {
      title: "Communications",
      url: "/admin/communications",
      icon: IconMail,
    },
  ],
  navSecondary: [
    {
      title: "Notifications",
      url: "/admin/notifications",
      icon: IconBell,
    },
    {
      title: "Security",
      url: "/admin/security",
      icon: IconShieldCheck,
    },
    {
      title: "API Keys",
      url: "/admin/api-keys",
      icon: IconKey,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/admin/help",
      icon: IconHelp,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Parcel Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
