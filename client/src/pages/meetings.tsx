import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus, ExternalLink } from "lucide-react";

export default function MeetingsPage() {
  const { data: meetings, isLoading } = useQuery({
    queryKey: [api.meetings.list.path],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Meetings</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {meetings?.map((meeting: any) => (
          <Card key={meeting.id} className="hover-elevate border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{meeting.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(meeting.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="capitalize px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                  {meeting.status}
                </span>
                {meeting.loopLink && (
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <a href={meeting.loopLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Loop Workspace
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {meeting.minutes && (
                <div className="relative overflow-hidden rounded-xl bg-muted/30 p-4">
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary/30" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Minutes Summary</p>
                  <p className="text-sm leading-relaxed text-foreground/80">{meeting.minutes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
