import { useState } from "react"
import { Calendar, PartyPopper, Book, Settings, ChevronUp, Command, Sparkles, Users } from "lucide-react"
import { Link, useLocation } from "wouter"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { CommandPalette } from "@/components/command-palette"

const mainItems = [
  {
    title: "Events",
    url: "/",
    icon: PartyPopper,
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Calendar,
    badge: "New",
  },
  {
    title: "Handbook",
    url: "/handbook",
    icon: Book,
  },
  {
    title: "Staff",
    url: "/staff",
    icon: Users,
  },
]

const bottomItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const [location] = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground" data-testid="sidebar-logo">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" data-testid="sidebar-title">Gleðinefnd</p>
              <p className="text-xs text-muted-foreground truncate" data-testid="sidebar-subtitle">Social Committee</p>
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground rotate-180" />
          </div>
        </SidebarHeader>

        <div className="px-4 py-2">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md bg-blue-100 dark:bg-blue-950 hover-elevate cursor-pointer transition-colors"
            data-testid="quick-actions"
          >
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Quick actions</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 px-1.5 font-mono text-[10px] font-medium text-blue-900 dark:text-blue-100">
              <Command className="w-3 h-3" />K
            </kbd>
          </button>
        </div>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-2" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="text-xs text-muted-foreground text-center" data-testid="sidebar-footer">
            Workplace Social Events
          </div>
        </SidebarFooter>
      </Sidebar>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
