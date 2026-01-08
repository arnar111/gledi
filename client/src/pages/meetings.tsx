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

      <div className="grid grid-cols-1 gap-4">
        {meetings?.map((meeting: any) => (
          <Card key={meeting.id} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{meeting.title}</CardTitle>
              {meeting.loopLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={meeting.loopLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Loop
                  </a>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span>{new Date(meeting.date).toLocaleString()}</span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {meeting.status}
                </span>
              </div>
              {meeting.minutes && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium mb-1">Minutes Summary:</p>
                  <p className="text-muted-foreground">{meeting.minutes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
