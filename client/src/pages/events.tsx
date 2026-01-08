import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Wand2 } from "lucide-react";
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Events</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events?.map((event: any) => (
          <Card key={event.id} className="hover-elevate overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="relative">
              {event.posterUrl ? (
                <img src={event.posterUrl} alt={event.title} className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-56 bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-12 w-12 text-primary/20" />
                </div>
              )}
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute bottom-4 right-4 rounded-full shadow-lg"
                onClick={() => posterMutation.mutate(event.id)}
                disabled={posterMutation.isPending}
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-xl font-bold tracking-tight">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{event.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</span>
                  <span className="text-sm font-medium">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <span className="capitalize px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {event.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
