import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ExternalLink, Calendar, FileText, Video, History } from "lucide-react";

export default function MeetingsPage() {
  const { data: meetings, isLoading } = useQuery({
    queryKey: [api.meetings.list.path],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-meetings">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="page-meetings">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-meetings-title">
            Committee Meetings
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-meetings-subtitle">Schedule and track your planning sessions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" asChild data-testid="button-add-old-meeting">
            <Link href="/meetings/new?past=true">
              <History className="h-4 w-4" /> Add Old Meeting
            </Link>
          </Button>
          <Button className="gap-2" asChild data-testid="button-schedule-meeting">
            <Link href="/meetings/new">
              <Plus className="h-4 w-4" /> Schedule Meeting
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4" data-testid="list-meetings">
        {meetings?.map((meeting: any) => (
          <Link 
            key={meeting.id} 
            href={`/meetings/${meeting.id}`} 
            className="block no-underline"
          >
            <Card 
              className="hover-elevate overflow-visible cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
              data-testid={`card-meeting-${meeting.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shrink-0">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{meeting.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(meeting.date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={meeting.status === 'scheduled' ? 'secondary' : 'default'}>
                      {meeting.status}
                    </Badge>
                    {meeting.loopLink && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2" 
                        asChild
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <a href={meeting.loopLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" /> 
                          Open in Loop
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {meeting.minutes && (
                <CardContent>
                  <div className="rounded-lg bg-muted/50 p-4 border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Meeting Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {meeting.minutes}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {meetings?.length === 0 && (
        <div className="text-center py-12" data-testid="empty-meetings">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No meetings scheduled</h3>
          <p className="text-muted-foreground mt-1">Schedule your first committee meeting</p>
        </div>
      )}
    </div>
  );
}
