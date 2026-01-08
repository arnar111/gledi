import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- EXISTING USER TABLE (from template) ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// --- CORE TABLES ---

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location"),
  status: text("status").$type<"planning" | "advertised" | "completed">().default("planning").notNull(),
  posterUrl: text("poster_url"),
  slackMessageTs: text("slack_message_ts"),
  budget: integer("budget").notNull(), // in KR
  maxAttendees: integer("max_attendees"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").$type<"going" | "maybe" | "not_going">().notNull(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  chairpersonId: integer("chairperson_id").references(() => users.id),
  secretaryId: integer("secretary_id").references(() => users.id),
  loopLink: text("loop_link"),
  minutes: text("minutes"), // Markdown or text
  status: text("status").$type<"scheduled" | "completed">().default("scheduled").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: text("priority").$type<"hot" | "warm" | "cold">().notNull(),
  status: text("status").$type<"todo" | "in_progress" | "done">().default("todo").notNull(),
  assigneeId: integer("assignee_id").references(() => users.id),
  eventId: integer("event_id").references(() => events.id),
  meetingId: integer("meeting_id").references(() => meetings.id),
  dueDate: timestamp("due_date"),
});

// --- EXPENSE TRACKING ---
export const expenseCategories = ["food", "decorations", "entertainment", "venue", "equipment", "prizes", "other"] as const;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in ISK
  category: text("category").$type<typeof expenseCategories[number]>().notNull(),
  vendor: text("vendor"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- EVENT TEMPLATES ---
export const eventTemplates = pgTable("event_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  budget: integer("budget").notNull(),
  maxAttendees: integer("max_attendees"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringType: text("recurring_type").$type<"weekly" | "biweekly" | "monthly">(),
  recurringDayOfWeek: integer("recurring_day_of_week"), // 0-6, Sunday=0
  recurringDayOfMonth: integer("recurring_day_of_month"), // 1-31
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- STAFF MANAGEMENT FOR SMS ---
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(), // E.164 format with +354 prefix
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smsNotifications = pgTable("sms_notifications", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  message: text("message").notNull(),
  status: text("status").$type<"pending" | "sent" | "failed">().default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- REPLIT AI CHAT TABLES (from blueprint) ---
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELATIONS ---

export const eventsRelations = relations(events, ({ many }) => ({
  attendees: many(eventAttendees),
  tasks: many(tasks),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  chairperson: one(users, { fields: [meetings.chairpersonId], references: [users.id] }),
  secretary: one(users, { fields: [meetings.secretaryId], references: [users.id] }),
  tasks: many(tasks),
}));

// --- SCHEMAS ---

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export const insertEventSchema = createInsertSchema(events, {
  status: z.enum(["planning", "advertised", "completed"]),
}).omit({ id: true, createdAt: true });

export const insertMeetingSchema = createInsertSchema(meetings, {
  status: z.enum(["scheduled", "completed"]),
}).omit({ id: true, createdAt: true });

export const insertTaskSchema = createInsertSchema(tasks, {
  priority: z.enum(["hot", "warm", "cold"]),
  status: z.enum(["todo", "in_progress", "done"]),
}).omit({ id: true });

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });

export const insertSmsNotificationSchema = createInsertSchema(smsNotifications, {
  status: z.enum(["pending", "sent", "failed"]),
}).omit({ id: true, createdAt: true, sentAt: true });

export const insertExpenseSchema = createInsertSchema(expenses, {
  category: z.enum(expenseCategories),
}).omit({ id: true, createdAt: true });

export const insertEventTemplateSchema = createInsertSchema(eventTemplates, {
  recurringType: z.enum(["weekly", "biweekly", "monthly"]).optional(),
}).omit({ id: true, createdAt: true });

// --- API TYPES ---

export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type SmsNotification = typeof smsNotifications.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type EventTemplate = typeof eventTemplates.$inferSelect;

export type CreateEventRequest = z.infer<typeof insertEventSchema>;
export type UpdateEventRequest = Partial<CreateEventRequest>;

export type CreateMeetingRequest = z.infer<typeof insertMeetingSchema>;
export type UpdateMeetingRequest = Partial<CreateMeetingRequest>;

export type CreateTaskRequest = z.infer<typeof insertTaskSchema>;
export type UpdateTaskRequest = Partial<CreateTaskRequest>;

export type CreateStaffRequest = z.infer<typeof insertStaffSchema>;
export type UpdateStaffRequest = Partial<CreateStaffRequest>;

export type CreateSmsNotificationRequest = z.infer<typeof insertSmsNotificationSchema>;

export type CreateExpenseRequest = z.infer<typeof insertExpenseSchema>;
export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

export type CreateEventTemplateRequest = z.infer<typeof insertEventTemplateSchema>;
export type UpdateEventTemplateRequest = Partial<CreateEventTemplateRequest>;
