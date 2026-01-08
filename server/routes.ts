import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/image/client";
import { fetchLoopContent } from "./sharepoint";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register AI Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

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

    const prompt = req.body.prompt || `A cool event poster for ${event.title}. ${event.description}`;
    
    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
      });
      
      const posterUrl = response.data?.[0]?.url || "";
      await storage.updateEvent(id, { posterUrl });
      res.json({ posterUrl });
    } catch (err) {
      res.status(500).json({ message: "Failed to generate poster" });
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

  app.post('/api/loop/import', async (req, res) => {
    try {
      const { loopUrl } = req.body;
      if (!loopUrl) {
        return res.status(400).json({ message: 'Loop URL is required' });
      }
      const content = await fetchLoopContent(loopUrl);
      res.json({ content });
    } catch (err: any) {
      console.error('Loop import error:', err);
      res.status(500).json({ message: err.message || 'Failed to import from Loop' });
    }
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
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const input = api.smsNotifications.create.input.parse(req.body);
      const notifications = input.staffIds.map((staffId) => ({
        eventId,
        staffId,
        message: input.message,
        status: 'pending' as const,
      }));
      const created = await storage.createSmsNotifications(notifications);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/events/:eventId/sms/send', async (req, res) => {
    // This will be implemented when Twilio is added
    // For now, just mark pending notifications as "sent" (stub)
    const eventId = parseInt(req.params.eventId);
    const notifications = await storage.getSmsNotifications(eventId);
    const pending = notifications.filter(n => n.status === 'pending');
    
    // Stub: mark as sent (Twilio integration will replace this)
    for (const n of pending) {
      await storage.updateSmsNotification(n.id, { 
        status: 'sent', 
        sentAt: new Date() 
      });
    }
    
    res.json({ sent: pending.length, failed: 0 });
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
