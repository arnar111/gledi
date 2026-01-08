import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Calendar, Sparkles } from "lucide-react";

const formSchema = insertEventSchema.extend({
  date: z.string().min(1, "Date is required"),
}).omit({ posterUrl: true, slackMessageTs: true, status: true });

type FormData = z.infer<typeof formSchema>;

export default function NewEventPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      location: "",
      budget: 0,
      maxAttendees: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        status: "planning" as const,
      };
      const res = await apiRequest("POST", api.events.create.path, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Event created successfully!" });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="page-new-event">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-page-title">
            Create New Event
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">Plan your next workplace event</p>
        </div>
      </div>

      <Card className="overflow-visible" data-testid="card-event-form">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle data-testid="text-form-title">Event Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-title">Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Quarterly Fun Day" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage data-testid="error-title" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-description">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what the event is about..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-description" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-date">Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-date" />
                      </FormControl>
                      <FormMessage data-testid="error-date" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-location">Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Hall" {...field} value={field.value || ""} data-testid="input-location" />
                      </FormControl>
                      <FormMessage data-testid="error-location" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-budget">Budget (ISK)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-budget"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-budget" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAttendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-max-attendees">Max Attendees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-max-attendees"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-max-attendees" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="gap-2" data-testid="button-submit">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
