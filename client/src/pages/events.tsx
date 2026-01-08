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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event: any) => (
          <Card key={event.id} className="hover-elevate overflow-hidden">
            {event.posterUrl && (
              <img src={event.posterUrl} alt={event.title} className="w-full h-48 object-cover" />
            )}
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{event.title}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => posterMutation.mutate(event.id)}
                disabled={posterMutation.isPending}
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
              <div className="flex justify-between text-sm">
                <span>{new Date(event.date).toLocaleDateString()}</span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
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
