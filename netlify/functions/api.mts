import type { Config, Context } from "@netlify/functions";
import serverless from "serverless-http";
import express from "express";
import { storage } from "../../server/storage";
import { api } from "../../shared/routes";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Events
app.get(api.events.list.path, async (_req, res) => {
  try {
    const events = await storage.getEvents();
    res.json(events);
  } catch (err) {
    console.error('[Events] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error('[Events] Create error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch(api.events.update.path, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const event = await storage.updateEvent(id, req.body);
    res.json(event);
  } catch (err) {
    console.error('[Events] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(api.events.generatePoster.path, async (req, res) => {
  const id = parseInt(req.params.id);
  const event = await storage.getEvent(id);
  if (!event) return res.status(404).json({ message: "Event not found" });

  try {
    const { generateEventPoster } = await import("../../server/gemini");
    const posterUrl = await generateEventPoster(
      event.title,
      event.description || "",
      new Date(event.date),
      event.location
    );
    await storage.updateEvent(id, { posterUrl });
    res.json({ posterUrl });
  } catch (err: any) {
    console.error("[Poster] Generation error:", err.message);
    res.status(500).json({ message: err.message || "Failed to generate poster" });
  }
});

// Meetings
app.get(api.meetings.list.path, async (_req, res) => {
  try {
    const meetings = await storage.getMeetings();
    res.json(meetings);
  } catch (err) {
    console.error('[Meetings] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get(api.meetings.get.path, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meeting = await storage.getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  } catch (err) {
    console.error('[Meetings] Get error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(api.meetings.create.path, async (req, res) => {
  try {
    const input = api.meetings.create.input.parse(req.body);
    const meeting = await storage.createMeeting({
      ...input,
      status: (input.status as "scheduled" | "completed") || "scheduled",
      date: new Date(input.date),
    });
    res.status(201).json(meeting);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('[Meetings] Create error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch(api.meetings.update.path, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meeting = await storage.updateMeeting(id, req.body);
    res.json(meeting);
  } catch (err) {
    console.error('[Meetings] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete(api.meetings.delete.path, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteMeeting(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Meetings] Delete error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Tasks
app.get(api.tasks.list.path, async (_req, res) => {
  try {
    const tasks = await storage.getTasks();
    res.json(tasks);
  } catch (err) {
    console.error('[Tasks] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch(api.tasks.update.path, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = await storage.updateTask(id, req.body);
    res.json(task);
  } catch (err) {
    console.error('[Tasks] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Staff
app.get(api.staff.list.path, async (_req, res) => {
  try {
    const staffList = await storage.getStaff();
    res.json(staffList);
  } catch (err) {
    console.error('[Staff] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post(api.staff.create.path, async (req, res) => {
  try {
    const input = api.staff.create.input.parse(req.body);
    const staffMember = await storage.createStaff(input);
    res.status(201).json(staffMember);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('[Staff] Create error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error('[Staff] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteStaff(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Staff] Delete error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// SMS Notifications
app.get('/api/events/:eventId/sms', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const notifications = await storage.getSmsNotifications(eventId);
    res.json(notifications);
  } catch (err) {
    console.error('[SMS] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('[SMS] Create Error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/events/:eventId/sms/send', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const notifications = await storage.getSmsNotifications(eventId);
    const pending = notifications.filter(n => n.status === 'pending');
    if (pending.length === 0) {
      return res.json({ sent: 0, failed: 0, message: "No pending notifications" });
    }
    const staffList = await storage.getStaff();
    const staffMap = new Map(staffList.map(s => [s.id, s]));
    let sent = 0;
    let failed = 0;
    for (const notification of pending) {
      const staffMember = staffMap.get(notification.staffId);
      if (!staffMember || !staffMember.phone) {
        await storage.updateSmsNotification(notification.id, { status: 'failed', sentAt: new Date() });
        failed++;
        continue;
      }
      const { sendSms } = await import("../../server/twilio");
      const result = await sendSms({ to: staffMember.phone, message: notification.message });
      if (result.success) {
        await storage.updateSmsNotification(notification.id, { status: 'sent', sentAt: new Date() });
        sent++;
      } else {
        await storage.updateSmsNotification(notification.id, { status: 'failed', sentAt: new Date() });
        failed++;
      }
    }
    res.json({ sent, failed, message: `Sent ${sent} message(s), ${failed} failed` });
  } catch (error: any) {
    console.error('SMS Send Error:', error);
    res.status(500).json({ message: "Failed to send SMS notifications", error: error.message });
  }
});

// Expenses
app.get('/api/events/:eventId/expenses', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const expenseList = await storage.getExpenses(eventId);
    res.json(expenseList);
  } catch (err) {
    console.error('[Expenses] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error('[Expenses] Create error:', err);
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
    console.error('[Expenses] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteExpense(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Expenses] Delete error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Event Templates
app.get('/api/templates', async (_req, res) => {
  try {
    const templates = await storage.getEventTemplates();
    res.json(templates);
  } catch (err) {
    console.error('[Templates] List error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error('[Templates] Create error:', err);
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
    console.error('[Templates] Update error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteEventTemplate(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Templates] Delete error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error('[Templates] Create event from template error:', err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Loop import (disabled)
app.post('/api/loop/import', async (_req, res) => {
  res.status(503).json({ message: 'Loop integration temporarily unavailable' });
});

const handler = serverless(app);

export default async (req: Request, context: Context) => {
  // Convert Web Request to AWS Lambda event format for serverless-http
  const url = new URL(req.url);
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await req.text()
    : null;

  const event = {
    httpMethod: req.method,
    path: url.pathname,
    headers,
    body,
    isBase64Encoded: false,
    queryStringParameters: Object.fromEntries(url.searchParams),
    requestContext: {
      http: { method: req.method, path: url.pathname },
    },
  };

  const result = await handler(event, {} as any);

  const responseHeaders: Record<string, string> = {};
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      responseHeaders[key] = String(value);
    }
  }

  return new Response(result.body, {
    status: result.statusCode,
    headers: responseHeaders,
  });
};

export const config: Config = {
  path: "/api/*",
};
