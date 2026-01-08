import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Wand2, Calendar, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const { toast } = useToast();
  const { data: events, isLoading } = useQuery({
    queryKey: [api.events.list.path],
  });

  const posterMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", buildUrl(api.events.generatePoster.path, { id }), {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Poster generated successfully!" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-events">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="page-events">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-events-title">
            Upcoming Events
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-events-subtitle">Plan and manage your workplace events</p>
        </div>
        <Button className="gap-2" data-testid="button-new-event">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-events">
        {events?.map((event: any) => (
          <Card 
            key={event.id} 
            className="hover-elevate group overflow-visible"
            data-testid={`card-event-${event.id}`}
          >
            <div className="relative overflow-hidden rounded-t-lg">
              {event.posterUrl ? (
                <img 
                  src={event.posterUrl} 
                  alt={event.title} 
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  data-testid={`img-poster-${event.id}`}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center" data-testid={`placeholder-poster-${event.id}`}>
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Generate a poster</p>
                  </div>
                </div>
              )}
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute bottom-3 right-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => posterMutation.mutate(event.id)}
                disabled={posterMutation.isPending}
                data-testid={`button-generate-poster-${event.id}`}
              >
                {posterMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl font-bold leading-tight" data-testid={`text-event-title-${event.id}`}>
                  {event.title}
                </CardTitle>
                <Badge 
                  variant={event.status === 'planning' ? 'secondary' : 'default'}
                  className="shrink-0"
                  data-testid={`badge-status-${event.id}`}
                >
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-event-description-${event.id}`}>
                {event.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5" data-testid={`text-event-date-${event.id}`}>
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5" data-testid={`text-event-location-${event.id}`}>
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.maxAttendees && (
                  <div className="flex items-center gap-1.5" data-testid={`text-event-attendees-${event.id}`}>
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.maxAttendees} max</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events?.length === 0 && (
        <div className="text-center py-12" data-testid="empty-events">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold" data-testid="text-empty-title">No events yet</h3>
          <p className="text-muted-foreground mt-1" data-testid="text-empty-message">Create your first event to get started</p>
        </div>
      )}
    </div>
  );
}
