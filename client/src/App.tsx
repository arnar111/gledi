import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import DashboardPage from "@/pages/dashboard";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import NewEventPage from "@/pages/new-event";
import MeetingsPage from "@/pages/meetings";
import NewMeetingPage from "@/pages/new-meeting";
import CalendarPage from "@/pages/calendar";
import TemplatesPage from "@/pages/templates";
import HandbookPage from "@/pages/handbook";
import StaffPage from "@/pages/staff";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/events/new" component={NewEventPage} />
      <Route path="/events/:id" component={EventDetailPage} />
      <Route path="/meetings" component={MeetingsPage} />
      <Route path="/meetings/new" component={NewMeetingPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/handbook" component={HandbookPage} />
      <Route path="/staff" component={StaffPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h1 className="text-xl font-bold">Gleðinefnd</h1>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
