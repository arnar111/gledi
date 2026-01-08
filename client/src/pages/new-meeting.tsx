import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
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
import { Loader2, ArrowLeft, Video, ExternalLink, History } from "lucide-react";

const formSchema = insertMeetingSchema.extend({
  date: z.string().min(1, "Date is required"),
}).omit({ status: true, chairpersonId: true, secretaryId: true });

type FormData = z.infer<typeof formSchema>;

export default function NewMeetingPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const isPastMeeting = searchString.includes('past=true');
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
        status: isPastMeeting ? "completed" as const : "scheduled" as const,
      };
      const res = await apiRequest("POST", api.meetings.create.path, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meetings.list.path] });
      toast({ title: isPastMeeting ? "Meeting added successfully!" : "Meeting scheduled successfully!" });
      navigate("/meetings");
    },
    onError: () => {
      toast({ title: isPastMeeting ? "Failed to add meeting" : "Failed to schedule meeting", variant: "destructive" });
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
            {isPastMeeting ? "Add Past Meeting" : "Schedule Meeting"}
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {isPastMeeting ? "Record a meeting that already happened" : "Plan your next committee session"}
          </p>
        </div>
      </div>

      <Card className="overflow-visible" data-testid="card-meeting-form">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              {isPastMeeting ? <History className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
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
                      Microsoft Loop Document
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Paste Loop document link here..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-loop-link"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-loop-description">
                      Paste a document link from your{" "}
                      <a 
                        href="https://loop.cloud.microsoft/p/eyJ3Ijp7InUiOiJodHRwczovL21pZGx1bi5zaGFyZXBvaW50LmNvbS8%2FbmF2PWN6MGxNa1ltWkQxaUlWSmlaMUl3YjA1ZmRtdGxhME5uTjAxQlpUVnhibk51Y0dSSU5HaExNVkpDY0VSQ1NFZDBaVEZhZEVOR1dTMWpXazh5VFdkUldtcHpNMDlTWWxwbE9VOG1aajB3TVZSQ1RGbEhVa3hLU2pKUlZrSkNOMDVOU2tSWlQwSkJVbGxJUkRWTlIwWldKbU05Sm1ac2RXbGtQVEUlM0QiLCJyIjpmYWxzZX0sInAiOnsidSI6Imh0dHBzOi8vbWlkbHVuLnNoYXJlcG9pbnQuY29tLzpmbDovci9jb250ZW50c3RvcmFnZS9DU1BfZDIxMWI4NDUtN2Y4My00N2JlLWE0MGEtMGVjYzAxZWU2YTllL0RvY3VtZW50JTIwTGlicmFyeS9Mb29wQXBwRGF0YS9VbnRpdGxlZC5sb29wP2Q9dzc1ZTM5ZDIzNTdjYzQ0MzJhY2U2MzAxMjNlZGMyZTBkJmNzZj0xJndlYj0xJm5hdj1jejBsTWtaamIyNTBaVzUwYzNSdmNtRm5aU1V5UmtOVFVGOWtNakV4WWpnME5TMDNaamd6TFRRM1ltVXRZVFF3WVMwd1pXTmpNREZsWlRaaE9XVW1aRDFpSVZKaVoxSXdiMDVmZG10bGEwTm5OMDFCWlRWeGJuTnVjR1JJTkdoTE1WSkNjRVJDU0VkMFpURmFkRU5HV1MxaldrOHlUV2RSV21wek0wOVNZbHBsT1U4bVpqMHdNVlJDVEZsSFVrcEVWRmhTV0V4VVExaEhTa05MV2xwU1VVTkpOMDVaVEZGT0ptTTlKVEpHSm1ac2RXbGtQVEVtWVQxTWIyOXdRWEJ3Sm5BOUpUUXdabXgxYVdSNEpUSkdiRzl2Y0Mxd1lXZGxMV052Ym5SaGFXNWxjaVo0UFNVM1FpVXlNbmNsTWpJbE0wRWxNakpVTUZKVVZVaDRkR0ZYVW5Oa1Z6UjFZekpvYUdOdFZuZGlNbXgxWkVNMWFtSXlNVGhaYVVaVFdXMWtVMDFIT1U5WU0xcHlXbGQwUkZwNlpFNVJWMVV4WTFjMWVtSnVRbXRUUkZKdlUzcEdVMUZ1UWtWUmEyaElaRWRWZUZkdVVrUlNiR3QwV1RGd1VFMXJNVzVWVm5CeFkzcE9VRlZ0U21GYVZHeFFaa1JCZUZaRlNrMVhWV1JUVkVWd1MwMXNSbGRSYTBrelZHc3hTMUpHYkZCUmEwWlRWMVZvUlU1Vk1VaFNiRmtsTTBRbE1qSWxNa01sTWpKcEpUSXlKVE5CSlRJeU5qazJNemMzWkRNdE1XVXdZaTAwTUdFNUxUaGhPR1l0TkRVNU5qa3pORFV4TldaaEpUSXlKVGRFIiwiciI6ZmFsc2V9LCJpIjp7ImkiOiI2OTYzNzdkMy0xZTBiLTQwYTktOGE4Zi00NTk2OTM0NTE1ZmEifX0%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                        data-testid="link-loop-workspace"
                      >
                        Loop workspace
                      </a>
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <FormLabel data-testid="label-minutes">{isPastMeeting ? "Meeting Minutes" : "Agenda / Notes"}</FormLabel>
                      {form.watch('loopLink') && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="gap-1.5"
                          onClick={() => window.open(form.getValues('loopLink') || '', '_blank')}
                          data-testid="button-open-loop"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Loop
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste or type your meeting notes here. You can copy content from your Loop document."
                        className="min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-minutes"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-minutes-description">
                      {isPastMeeting 
                        ? "Record what was discussed. Copy from Loop if needed." 
                        : "Pre-fill the agenda or copy from your Loop document"}
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
                  {isPastMeeting ? "Add Meeting" : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
