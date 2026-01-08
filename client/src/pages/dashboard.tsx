import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import type { Event, Meeting, EventTemplate } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar, PartyPopper, Users, Clock, ArrowRight, Sparkles } from "lucide-react";

function getTimeUntil(date: Date): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

function CountdownCard({ event }: { event: Event }) {
  const { days, hours, minutes } = getTimeUntil(new Date(event.date));
  const isToday = days === 0 && hours < 24;
  const isSoon = days <= 3;

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`countdown-card-${event.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/events/${event.id}`}>
              <h3 className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors" data-testid={`countdown-title-${event.id}`}>
                {event.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(event.date).toLocaleDateString("is-IS", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground">{event.location}</p>
            )}
          </div>
          {isToday && (
            <Badge className="shrink-0 animate-pulse">Today</Badge>
          )}
          {!isToday && isSoon && (
            <Badge variant="secondary" className="shrink-0">Soon</Badge>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center" data-testid={`countdown-timer-${event.id}`}>
          <div className="p-3 rounded-lg bg-primary/10">
            <span className="text-2xl font-bold text-primary">{days}</span>
            <p className="text-xs text-muted-foreground mt-1">Days</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/10">
            <span className="text-2xl font-bold text-secondary">{hours}</span>
            <p className="text-xs text-muted-foreground mt-1">Hours</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10">
            <span className="text-2xl font-bold">{minutes}</span>
            <p className="text-xs text-muted-foreground mt-1">Minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [api.events.list.path],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: [api.meetings.list.path],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EventTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const isLoading = eventsLoading || meetingsLoading || templatesLoading;

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextEvent = upcomingEvents[0];
  const countdownEvents = upcomingEvents.slice(0, 4);

  const stats = {
    totalEvents: events.length,
    upcomingEvents: upcomingEvents.length,
    totalMeetings: meetings.length,
    upcomingMeetings: upcomingMeetings.length,
    templates: templates.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-dashboard">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="page-dashboard">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-dashboard-title">
          Dashboard
        </h2>
        <p className="text-muted-foreground mt-1" data-testid="text-dashboard-subtitle">
          Welcome back! Here's what's happening with your social committee.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
        <Card data-testid="stat-upcoming-events">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <PartyPopper className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">{stats.totalEvents} total events</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-upcoming-meetings">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground">{stats.totalMeetings} total meetings</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-templates">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Event Templates</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-muted-foreground">reusable templates</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-next-event">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Next Event</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <>
                <div className="text-lg font-bold truncate">{getTimeUntil(new Date(nextEvent.date)).days} days</div>
                <p className="text-xs text-muted-foreground truncate">{nextEvent.title}</p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold">-</div>
                <p className="text-xs text-muted-foreground">No upcoming events</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2" data-testid="text-countdowns-title">
            <Clock className="h-5 w-5 text-primary" />
            Event Countdowns
          </h3>
          <Button variant="ghost" size="sm" asChild data-testid="button-view-all-events">
            <Link href="/">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        
        {countdownEvents.length === 0 ? (
          <Card className="p-8 text-center" data-testid="empty-countdowns">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No upcoming events</h3>
            <p className="text-muted-foreground mt-1">Create an event to see the countdown here</p>
            <Button className="mt-4" asChild>
              <Link href="/events/new">Create Event</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="countdowns-grid">
            {countdownEvents.map((event) => (
              <CountdownCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-quick-new-event">
              <Link href="/events/new">
                <PartyPopper className="h-5 w-5" />
                <span>New Event</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-quick-new-meeting">
              <Link href="/meetings/new">
                <Users className="h-5 w-5" />
                <span>New Meeting</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-quick-calendar">
              <Link href="/calendar">
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-quick-templates">
              <Link href="/templates">
                <Sparkles className="h-5 w-5" />
                <span>Templates</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Upcoming This Week</CardTitle>
            <CardDescription>Events and meetings in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...upcomingEvents, ...upcomingMeetings]
              .filter((item) => {
                const itemDate = new Date(item.date);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return itemDate <= weekFromNow;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((item) => {
                const isEvent = "budget" in item;
                return (
                  <div
                    key={`${isEvent ? "event" : "meeting"}-${item.id}`}
                    className="flex items-center gap-3 p-2 rounded-md"
                    data-testid={`activity-${isEvent ? "event" : "meeting"}-${item.id}`}
                  >
                    {isEvent ? (
                      <PartyPopper className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Users className="h-4 w-4 text-secondary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("is-IS", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={isEvent ? "default" : "secondary"} className="shrink-0">
                      {isEvent ? "Event" : "Meeting"}
                    </Badge>
                  </div>
                );
              })}
            {[...upcomingEvents, ...upcomingMeetings].filter((item) => {
              const itemDate = new Date(item.date);
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return itemDate <= weekFromNow;
            }).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nothing scheduled this week
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
