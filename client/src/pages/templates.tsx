import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { EventTemplate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Copy, Trash2, CalendarPlus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TemplatesPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [eventDate, setEventDate] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    location: "",
    budget: 0,
    maxAttendees: 30,
    isRecurring: false,
    recurringType: "monthly" as "weekly" | "biweekly" | "monthly",
    recurringDayOfWeek: 1,
    recurringDayOfMonth: 15,
  });

  const { data: templates = [], isLoading } = useQuery<EventTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/templates", {
        ...data,
        recurringType: data.isRecurring ? data.recurringType : null,
        recurringDayOfWeek: data.isRecurring && data.recurringType !== "monthly" ? data.recurringDayOfWeek : null,
        recurringDayOfMonth: data.isRecurring && data.recurringType === "monthly" ? data.recurringDayOfMonth : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template created successfully!" });
      closeCreateDialog();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async ({ id, date }: { id: number; date: string }) => {
      const res = await apiRequest("POST", `/api/templates/${id}/create-event`, { date });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Event created from template!" });
      closeScheduleDialog();
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({
      name: "",
      title: "",
      description: "",
      location: "",
      budget: 0,
      maxAttendees: 30,
      isRecurring: false,
      recurringType: "monthly",
      recurringDayOfWeek: 1,
      recurringDayOfMonth: 15,
    });
  };

  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedTemplate(null);
    setEventDate("");
  };

  const openScheduleDialog = (template: EventTemplate) => {
    setSelectedTemplate(template);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    setEventDate(nextDate.toISOString().split("T")[0]);
    setScheduleDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleCreateEvent = () => {
    if (!selectedTemplate || !eventDate) return;
    createEventMutation.mutate({ id: selectedTemplate.id, date: eventDate });
  };

  const getRecurringLabel = (template: EventTemplate) => {
    if (!template.isRecurring) return null;
    if (template.recurringType === "monthly" && template.recurringDayOfMonth) {
      return `Monthly on day ${template.recurringDayOfMonth}`;
    }
    if (template.recurringType === "biweekly" && template.recurringDayOfWeek !== null) {
      return `Biweekly on ${weekDays[template.recurringDayOfWeek]}`;
    }
    if (template.recurringType === "weekly" && template.recurringDayOfWeek !== null) {
      return `Weekly on ${weekDays[template.recurringDayOfWeek]}`;
    }
    return template.recurringType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-templates">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="page-templates">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-templates-title">
            Event Templates
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="text-templates-subtitle">
            Create reusable templates for recurring events like movie nights and sports days
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)} data-testid="button-new-template">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-templates">
        {templates.map((template) => (
          <Card key={template.id} className="hover-elevate overflow-visible" data-testid={`card-template-${template.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-template-name-${template.id}`}>
                    {template.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-template-title-${template.id}`}>
                    {template.title}
                  </CardDescription>
                </div>
                {template.isRecurring && (
                  <Badge variant="secondary" className="gap-1 shrink-0" data-testid={`badge-recurring-${template.id}`}>
                    <RefreshCw className="h-3 w-3" />
                    Recurring
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-template-desc-${template.id}`}>
                {template.description || "No description"}
              </p>
              
              <div className="flex flex-wrap gap-2 text-sm">
                {template.location && (
                  <Badge variant="outline" data-testid={`badge-location-${template.id}`}>
                    {template.location}
                  </Badge>
                )}
                <Badge variant="outline" data-testid={`badge-budget-${template.id}`}>
                  {template.budget.toLocaleString("is-IS")} ISK
                </Badge>
                {template.maxAttendees && (
                  <Badge variant="outline" data-testid={`badge-attendees-${template.id}`}>
                    Max {template.maxAttendees}
                  </Badge>
                )}
              </div>

              {template.isRecurring && (
                <p className="text-xs text-muted-foreground" data-testid={`text-recurring-${template.id}`}>
                  {getRecurringLabel(template)}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => openScheduleDialog(template)}
                  data-testid={`button-use-template-${template.id}`}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Create Event
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(template.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-template-${template.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12" data-testid="empty-templates">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Copy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold" data-testid="text-empty-title">No templates yet</h3>
          <p className="text-muted-foreground mt-1" data-testid="text-empty-message">
            Create templates for events you run regularly
          </p>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="text-create-dialog-title">Create Event Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Movie Night"
                required
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Movie Night"
                required
                data-testid="input-template-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What happens at this event?"
                data-testid="input-template-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Meeting Room B"
                  data-testid="input-template-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (ISK)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  data-testid="input-template-budget"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 0 })}
                data-testid="input-template-max-attendees"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="recurring" className="cursor-pointer">Recurring Event</Label>
                <p className="text-sm text-muted-foreground">Set up a schedule for this event</p>
              </div>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                data-testid="switch-recurring"
              />
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurringType}
                    onValueChange={(value: "weekly" | "biweekly" | "monthly") => 
                      setFormData({ ...formData, recurringType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-recurring-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurringType === "monthly" ? (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={formData.recurringDayOfMonth}
                      onChange={(e) => setFormData({ ...formData, recurringDayOfMonth: parseInt(e.target.value) || 1 })}
                      data-testid="input-day-of-month"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={formData.recurringDayOfWeek.toString()}
                      onValueChange={(value) => setFormData({ ...formData, recurringDayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-day-of-week">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreateDialog} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-template">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-schedule-dialog-title">Schedule Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Create an event from the "{selectedTemplate?.name}" template
            </p>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                data-testid="input-event-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeScheduleDialog} data-testid="button-cancel-schedule">
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending || !eventDate}
              data-testid="button-create-event"
            >
              {createEventMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
