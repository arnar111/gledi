import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
// Temporarily commented out for debugging
// import { registerChatRoutes } from "./replit_integrations/chat";
// import { registerImageRoutes } from "./replit_integrations/image";
// import { openai } from "./replit_integrations/image/client";
// import { fetchLoopContent } from "./sharepoint";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register AI Integrations - temporarily disabled
  // registerChatRoutes(app);
  // registerImageRoutes(app);

  // Events
  app.get(api.events.list.path, async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post(api.events.create.path, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent({
        ...input,
        description: input.description || "",
        budget: input.budget || 0,
        status: (input.status as "planning" | "advertised" | "completed") || "planning",
        date: new Date(input.date),
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.events.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const event = await storage.updateEvent(id, req.body);
    res.json(event);
  });

  app.post(api.events.generatePoster.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const event = await storage.getEvent(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    try {
      const { generateEventPoster } = await import("./gemini");
      const posterUrl = await generateEventPoster(
        event.title,
        event.description || "",
        new Date(event.date),
        event.location
      );

      // Update event with poster URL
      await storage.updateEvent(id, { posterUrl });

      res.json({ posterUrl });
    } catch (err: any) {
      console.error("[Poster] Generation error:", err.message);
      res.status(500).json({ message: err.message || "Failed to generate poster" });
    }
  });

  // Meetings
  app.get(api.meetings.list.path, async (_req, res) => {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  });

  app.post(api.meetings.create.path, async (req, res) => {
    const input = api.meetings.create.input.parse(req.body);
    const meeting = await storage.createMeeting({
      ...input,
      status: (input.status as "scheduled" | "completed") || "scheduled",
      date: new Date(input.date),
    });
    res.status(201).json(meeting);
  });

  app.patch(api.meetings.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const meeting = await storage.updateMeeting(id, req.body);
    res.json(meeting);
  });

  // Loop import temporarily disabled
  app.post('/api/loop/import', async (req, res) => {
    res.status(503).json({ message: 'Loop integration temporarily unavailable' });
  });

  // Tasks
  app.get(api.tasks.list.path, async (_req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const task = await storage.updateTask(id, req.body);
    res.json(task);
  });

  // Staff
  app.get(api.staff.list.path, async (_req, res) => {
    const staffList = await storage.getStaff();
    res.json(staffList);
  });

  app.post(api.staff.create.path, async (req, res) => {
    const input = api.staff.create.input.parse(req.body);
    const staffMember = await storage.createStaff(input);
    res.status(201).json(staffMember);
  });

  app.patch('/api/staff/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.staff.update.input.parse(req.body);
      const updated = await storage.updateStaff(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/staff/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteStaff(id);
    res.json({ success: true });
  });

  // SMS Notifications
  app.get('/api/events/:eventId/sms', async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const notifications = await storage.getSmsNotifications(eventId);
    res.json(notifications);
  });

  app.post('/api/events/:eventId/sms', async (req, res) => {
    try {
      console.log(`[SMS] Create request for event ${req.params.eventId}`);
      const eventId = parseInt(req.params.eventId);
      console.log(`[SMS] Parsed eventId: ${eventId}`);

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      console.log(`[SMS] Payload:`, JSON.stringify(req.body));
      const input = api.smsNotifications.create.input.parse(req.body);
      console.log(`[SMS] Parsed input, staffIds count: ${input.staffIds.length}`);

      const notifications = input.staffIds.map((staffId) => ({
        eventId,
        staffId,
        message: input.message,
        status: 'pending' as const,
      }));

      const created = await storage.createSmsNotifications(notifications);
      console.log(`[SMS] Created ${created.length} notifications in DB`);

      res.status(201).json(created);
    } catch (err: any) {
      console.error('[SMS] Create Error:', err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/events/:eventId/sms/send', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      console.log(`[SMS SEND] ========================================`);
      console.log(`[SMS SEND] Send request for event ID: ${eventId}`);

      const event = await storage.getEvent(eventId);
      if (!event) {
        console.log(`[SMS SEND] Event not found for ID: ${eventId}`);
        return res.status(404).json({ message: "Event not found" });
      }
      console.log(`[SMS SEND] Found event: "${event.title}"`);

      // Get all pending SMS notifications for this event
      const notifications = await storage.getSmsNotifications(eventId);
      console.log(`[SMS SEND] Found ${notifications.length} total notifications for event`);
      if (notifications.length > 0) {
        console.log(`[SMS SEND] Notification statuses:`, notifications.map(n => ({ id: n.id, status: n.status, staffId: n.staffId })));
      }

      const pending = notifications.filter(n => n.status === 'pending');
      console.log(`[SMS SEND] Found ${pending.length} pending notifications`);

      if (pending.length === 0) {
        console.log(`[SMS SEND] WARNING: No pending notifications found! This means the /sms create endpoint may have failed.`);
        return res.json({ sent: 0, failed: 0, message: "No pending notifications" });
      }

      // Get staff details for each pending notification
      const staffList = await storage.getStaff();
      const staffMap = new Map(staffList.map(s => [s.id, s]));

      let sent = 0;
      let failed = 0;

      // Send SMS to each recipient
      for (const notification of pending) {
        const staff = staffMap.get(notification.staffId);
        if (!staff || !staff.phone) {
          // Mark as failed if staff not found or no phone number
          await storage.updateSmsNotification(notification.id, {
            status: 'failed',
            sentAt: new Date(),
          });
          failed++;
          continue;
        }

        // Import Twilio service dynamically
        const { sendSms } = await import('./twilio');

        // Send SMS via Twilio
        const result = await sendSms({
          to: staff.phone,
          message: notification.message,
        });

        if (result.success) {
          await storage.updateSmsNotification(notification.id, {
            status: 'sent',
            sentAt: new Date(),
          });
          sent++;
        } else {
          await storage.updateSmsNotification(notification.id, {
            status: 'failed',
            sentAt: new Date(),
          });
          failed++;
          console.error(`Failed to send SMS to ${staff.phone}:`, result.error);
        }
      }

      res.json({
        sent,
        failed,
        message: `Sent ${sent} message(s), ${failed} failed`
      });
    } catch (error: any) {
      console.error('SMS Send Error:', error);
      res.status(500).json({
        message: "Failed to send SMS notifications",
        error: error.message
      });
    }
  });

  // Expenses
  app.get('/api/events/:eventId/expenses', async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const expenseList = await storage.getExpenses(eventId);
    res.json(expenseList);
  });

  app.post('/api/events/:eventId/expenses', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense({ ...input, eventId });
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/expenses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.expenses.update.input.parse(req.body);
      const expense = await storage.updateExpense(id, input);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteExpense(id);
    res.json({ success: true });
  });

  // Event Templates
  app.get('/api/templates', async (_req, res) => {
    const templates = await storage.getEventTemplates();
    res.json(templates);
  });

  app.post('/api/templates', async (req, res) => {
    try {
      const input = api.eventTemplates.create.input.parse(req.body);
      const template = await storage.createEventTemplate(input);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.eventTemplates.update.input.parse(req.body);
      const template = await storage.updateEventTemplate(id, input);
      res.json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/templates/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteEventTemplate(id);
    res.json({ success: true });
  });

  app.post('/api/templates/:id/create-event', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEventTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const input = api.eventTemplates.createEventFromTemplate.input.parse(req.body);
      const event = await storage.createEvent({
        title: template.title,
        description: template.description,
        date: new Date(input.date),
        location: template.location,
        budget: template.budget,
        maxAttendees: template.maxAttendees,
        status: "planning",
        posterUrl: null,
        slackMessageTs: null,
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingEvents = await storage.getEvents();
  if (existingEvents.length === 0) {
    await storage.createEvent({
      title: "Quarterly Fun Day",
      description: "A day filled with games and laughter for all employees.",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "Main Hall",
      status: "planning",
      budget: 50000,
      maxAttendees: 50,
      posterUrl: null,
      slackMessageTs: null,
    });

    await storage.createMeeting({
      title: "Kickoff Planning Meeting",
      date: new Date(),
      chairpersonId: null,
      secretaryId: null,
      loopLink: "https://loop.microsoft.com/example",
      minutes: "Initial brainstorming session.",
      status: "scheduled",
    });
  }

  // Seed staff if empty
  const existingStaff = await storage.getStaff();
  if (existingStaff.length === 0) {
    const staffList = [
      { name: "Agnes Engla Valdimarsdóttir", phone: "+3548542824" },
      { name: "Anja Birta Þrastardóttir", phone: "+3547717778" },
      { name: "Anton Smári Hrafnhildarson", phone: "+3547603610" },
      { name: "Arnþór Ómar Gíslason", phone: "+3548406674" },
      { name: "Auður Ingibjörg Konráðsdóttir", phone: "+3548238000" },
      { name: "Ágústa Mjöll Gísladóttir", phone: "+3546598549" },
      { name: "Bent Kingo Andersen", phone: "+3547862322" },
      { name: "Bjarni Snær Gunnarsson", phone: "+3548523821" },
      { name: "Bjartur Dagur Gunnarsson", phone: "+3546167151" },
      { name: "Björgúlfur Kristófer Sigurðsson", phone: "+3546986074" },
      { name: "Daníel Breki Johnsen", phone: "+3548448779" },
      { name: "Frederikke Bang", phone: "+3547738401" },
      { name: "Guðbrandur Loki Rúnarsson", phone: "+3546916393" },
      { name: "Guðjón Einar Guðrúnarson", phone: "+3547713122" },
      { name: "Hafdís Lind Magnúsdóttir", phone: "+3548695800" },
      { name: "Heiðrun Magnusardóttir Isaksen", phone: "+3547867222" },
      { name: "Halldór Björn Hansen", phone: "+3546636934" },
      { name: "Hildur Sigurðardóttir", phone: "+3546914966" },
      { name: "Ingamaría Eyjólfsdóttir", phone: "+3546931384" },
      { name: "Ísak Bjarki Yngvason", phone: "+3546907785" },
      { name: "Kári Ragúels Víðisson", phone: "+3547845656" },
      { name: "Kristín Aldís Markúsdóttir", phone: "+3548485578" },
      { name: "Magnús Orri Aðalsteinsson", phone: "+3548204970" },
      { name: "Matthildur Steinbergsdóttir", phone: "+3546908015" },
      { name: "Nadía Lóa Atladóttir", phone: "+3546969990" },
      { name: "Ragna Katrín Björgvinsdóttir", phone: "+3546615159" },
      { name: "Sigurjón Örn Magnússon", phone: "+3548688109" },
      { name: "Sindri Hannesson", phone: "+3546963593" },
      { name: "Unnur Sesselía Ólafsdóttir", phone: "+3546989815" },
    ];

    for (const s of staffList) {
      await storage.createStaff({ name: s.name, phone: s.phone, isActive: true });
    }
  }
}
