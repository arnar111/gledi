import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertMeetingSchema } from "@shared/schema";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Video, ExternalLink } from "lucide-react";

const formSchema = insertMeetingSchema.extend({
  date: z.string().min(1, "Date is required"),
}).omit({ status: true, chairpersonId: true, secretaryId: true });

type FormData = z.infer<typeof formSchema>;

export default function NewMeetingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      loopLink: "",
      minutes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        status: "scheduled" as const,
      };
      const res = await apiRequest("POST", api.meetings.create.path, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meetings.list.path] });
      toast({ title: "Meeting scheduled successfully!" });
      navigate("/meetings");
    },
    onError: () => {
      toast({ title: "Failed to schedule meeting", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="page-new-meeting">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-page-title">
            Schedule Meeting
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">Plan your next committee session</p>
        </div>
      </div>

      <Card className="overflow-visible" data-testid="card-meeting-form">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <CardTitle data-testid="text-form-title">Meeting Details</CardTitle>
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
                    <FormLabel data-testid="label-title">Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 Planning Session" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage data-testid="error-title" />
                  </FormItem>
                )}
              />

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
                name="loopLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2" data-testid="label-loop-link">
                      Microsoft Loop Link
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://loop.microsoft.com/..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-loop-link"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-loop-description">
                      Add a Loop workspace link for collaborative note-taking
                    </FormDescription>
                    <FormMessage data-testid="error-loop-link" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-minutes">Agenda / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Meeting agenda and notes..."
                        className="min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-minutes"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-minutes-description">
                      Pre-fill the agenda or leave blank for later
                    </FormDescription>
                    <FormMessage data-testid="error-minutes" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/meetings")} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="gap-2" data-testid="button-submit">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Schedule Meeting
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
