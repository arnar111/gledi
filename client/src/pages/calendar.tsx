import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import type { Event, Meeting } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PartyPopper, Users } from "lucide-react";
import { Loader2 } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [api.events.list.path],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: [api.meetings.list.path],
  });

  const isLoading = eventsLoading || meetingsLoading;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return events.filter((e) => new Date(e.date).toDateString() === dateStr);
  };

  const getMeetingsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString();
    return meetings.filter((m) => new Date(m.date).toDateString() === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-28 border-b border-r border-border/50" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const dayMeetings = getMeetingsForDay(day);
      const hasItems = dayEvents.length > 0 || dayMeetings.length > 0;

      days.push(
        <div
          key={day}
          className={`h-28 border-b border-r border-border/50 p-1 overflow-hidden ${
            isToday(day) ? "bg-primary/5" : ""
          }`}
          data-testid={`calendar-day-${day}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                isToday(day)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {day}
            </span>
            {hasItems && (
              <Badge variant="secondary" className="text-xs px-1">
                {dayEvents.length + dayMeetings.length}
              </Badge>
            )}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 2).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div
                  className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary truncate cursor-pointer hover:bg-primary/30 transition-colors"
                  data-testid={`calendar-event-${event.id}`}
                >
                  {event.title}
                </div>
              </Link>
            ))}
            {dayMeetings.slice(0, 2).map((meeting) => (
              <div
                key={meeting.id}
                className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary-foreground truncate"
                data-testid={`calendar-meeting-${meeting.id}`}
              >
                {meeting.title}
              </div>
            ))}
            {(dayEvents.length + dayMeetings.length > 2) && (
              <span className="text-xs text-muted-foreground pl-1">
                +{dayEvents.length + dayMeetings.length - 2} more
              </span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-calendar">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-calendar">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-calendar-title">
            Calendar
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-calendar-subtitle">
            View all events and meetings at a glance
          </p>
        </div>
        <Button variant="outline" onClick={goToToday} data-testid="button-today">
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="xl:col-span-3" data-testid="card-calendar">
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={prevMonth} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold" data-testid="text-current-month">
              {months[month]} {year}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">{renderCalendarDays()}</div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card data-testid="card-upcoming-events">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-primary" />
                Upcoming Events
              </h3>
            </div>
            <CardContent className="p-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming events
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div
                      className="p-2 rounded-md hover-elevate cursor-pointer"
                      data-testid={`upcoming-event-${event.id}`}
                    >
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("is-IS", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-upcoming-meetings">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                Upcoming Meetings
              </h3>
            </div>
            <CardContent className="p-4 space-y-3">
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming meetings
                </p>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-2 rounded-md"
                    data-testid={`upcoming-meeting-${meeting.id}`}
                  >
                    <p className="font-medium text-sm truncate">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(meeting.date).toLocaleDateString("is-IS", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
