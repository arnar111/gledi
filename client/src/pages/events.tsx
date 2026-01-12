import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Staff, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Wand2, Calendar, MapPin, Users, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const { toast } = useToast();
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: [api.events.list.path],
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: [api.staff.list.path],
  });

  const activeStaff = staffList.filter((s) => s.isActive);

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

  const smsMutation = useMutation({
    mutationFn: async ({ eventId, message, staffIds }: { eventId: number; message: string; staffIds: number[] }) => {
      console.log('[SMS Client] Starting SMS flow for event:', eventId, 'with', staffIds.length, 'staff');

      // Step 1: Create SMS notification records
      const createRes = await apiRequest("POST", `/api/events/${eventId}/sms`, { message, staffIds });
      const created = await createRes.json();
      console.log('[SMS Client] Created notifications:', created.length, created);

      // Step 2: Send the pending notifications  
      const sendRes = await apiRequest("POST", `/api/events/${eventId}/sms/send`);
      const result = await sendRes.json();
      console.log('[SMS Client] Send result:', result);

      return result;
    },
    onSuccess: (data) => {
      toast({ title: `SMS notifications queued! ${data.sent} messages will be sent.` });
      closeSmsDialog();
    },
    onError: () => {
      toast({ title: "Failed to send SMS notifications", variant: "destructive" });
    },
  });

  const openSmsDialog = (event: Event) => {
    setSelectedEvent(event);
    setSelectedStaffIds(activeStaff.map((s) => s.id));
    setSmsMessage(`You're invited to ${event.title} on ${new Date(event.date).toLocaleDateString()}! ${event.location ? `Location: ${event.location}` : ""}`);
    setSmsDialogOpen(true);
  };

  const closeSmsDialog = () => {
    setSmsDialogOpen(false);
    setSelectedEvent(null);
    setSmsMessage("");
    setSelectedStaffIds([]);
  };

  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const selectAllStaff = () => {
    setSelectedStaffIds(activeStaff.map((s) => s.id));
  };

  const deselectAllStaff = () => {
    setSelectedStaffIds([]);
  };

  const handleSendSms = () => {
    if (!selectedEvent || !smsMessage || selectedStaffIds.length === 0) return;
    smsMutation.mutate({
      eventId: selectedEvent.id,
      message: smsMessage,
      staffIds: selectedStaffIds,
    });
  };

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
        <Button className="gap-2" asChild data-testid="button-new-event">
          <Link href="/events/new">
            <Plus className="h-4 w-4" /> New Event
          </Link>
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
                <Link href={`/events/${event.id}`}>
                  <CardTitle className="text-xl font-bold leading-tight hover:underline cursor-pointer" data-testid={`text-event-title-${event.id}`}>
                    {event.title}
                  </CardTitle>
                </Link>
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

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 mt-2"
                onClick={() => openSmsDialog(event)}
                data-testid={`button-notify-staff-${event.id}`}
              >
                <MessageSquare className="h-4 w-4" />
                Notify Staff
              </Button>
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

      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="text-sms-dialog-title">Notify Staff via SMS</DialogTitle>
            <DialogDescription data-testid="text-sms-dialog-description">
              Send SMS notifications about "{selectedEvent?.title}" to selected staff members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Enter your SMS message..."
                className="min-h-[100px]"
                maxLength={160}
                data-testid="input-sms-message"
              />
              <p className="text-xs text-muted-foreground text-right">
                {smsMessage.length}/160 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Recipients ({selectedStaffIds.length} selected)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllStaff}
                    data-testid="button-select-all"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllStaff}
                    data-testid="button-deselect-all"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                {activeStaff.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active staff members. Add staff in the Staff page first.
                  </p>
                ) : (
                  activeStaff.map((staff) => (
                    <label
                      key={staff.id}
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                      data-testid={`checkbox-staff-${staff.id}`}
                    >
                      <Checkbox
                        checked={selectedStaffIds.includes(staff.id)}
                        onCheckedChange={() => toggleStaffSelection(staff.id)}
                      />
                      <span className="flex-1 text-sm">{staff.name}</span>
                      <span className="text-xs text-muted-foreground">{staff.phone}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeSmsDialog} data-testid="button-cancel-sms">
              Cancel
            </Button>
            <Button
              onClick={handleSendSms}
              disabled={smsMutation.isPending || selectedStaffIds.length === 0 || !smsMessage}
              className="gap-2"
              data-testid="button-send-sms"
            >
              {smsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send to {selectedStaffIds.length} {selectedStaffIds.length === 1 ? "person" : "people"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
