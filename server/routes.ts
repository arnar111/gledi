import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/image/client";

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
      
      const posterUrl = response.data[0].url || "";
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
      date: new Date(input.date),
    });
    res.status(201).json(meeting);
  });

  app.patch(api.meetings.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const meeting = await storage.updateMeeting(id, req.body);
    res.json(meeting);
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

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingEvents = await storage.getEvents();
  if (existingEvents.length === 0) {
    const event = await storage.createEvent({
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
}
