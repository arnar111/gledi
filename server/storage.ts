import { db } from "./db";
import {
  users, events, meetings, tasks, eventAttendees, staff, smsNotifications, expenses, eventTemplates,
  type User, type Event, type Meeting, type Task, type Staff, type SmsNotification, type Expense, type EventTemplate,
  type CreateEventRequest, type UpdateEventRequest,
  type CreateMeetingRequest, type UpdateMeetingRequest,
  type CreateTaskRequest, type UpdateTaskRequest,
  type CreateStaffRequest, type UpdateStaffRequest,
  type CreateSmsNotificationRequest,
  type CreateExpenseRequest, type UpdateExpenseRequest,
  type CreateEventTemplateRequest, type UpdateEventTemplateRequest,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: CreateEventRequest): Promise<Event>;
  updateEvent(id: number, updates: UpdateEventRequest): Promise<Event>;

  // Meetings
  getMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: CreateMeetingRequest): Promise<Meeting>;
  updateMeeting(id: number, updates: UpdateMeetingRequest): Promise<Meeting>;

  // Tasks
  getTasks(): Promise<Task[]>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getActiveStaff(): Promise<Staff[]>;
  createStaff(staffMember: CreateStaffRequest): Promise<Staff>;
  updateStaff(id: number, updates: UpdateStaffRequest): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;

  // SMS Notifications
  getSmsNotifications(eventId: number): Promise<SmsNotification[]>;
  createSmsNotifications(notifications: CreateSmsNotificationRequest[]): Promise<SmsNotification[]>;
  updateSmsNotification(id: number, updates: Partial<SmsNotification>): Promise<SmsNotification>;

  // Expenses
  getExpenses(eventId: number): Promise<Expense[]>;
  createExpense(expense: CreateExpenseRequest): Promise<Expense>;
  updateExpense(id: number, updates: UpdateExpenseRequest): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Event Templates
  getEventTemplates(): Promise<EventTemplate[]>;
  getEventTemplate(id: number): Promise<EventTemplate | undefined>;
  createEventTemplate(template: CreateEventTemplateRequest): Promise<EventTemplate>;
  updateEventTemplate(id: number, updates: UpdateEventTemplateRequest): Promise<EventTemplate>;
  deleteEventTemplate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: CreateEventRequest): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: UpdateEventRequest): Promise<Event> {
    const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return updated;
  }

  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings);
  }

  async createMeeting(meeting: CreateMeetingRequest): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: number, updates: UpdateMeetingRequest): Promise<Meeting> {
    const [updated] = await db.update(meetings).set(updates).where(eq(meetings.id, id)).returning();
    return updated;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  // Staff methods
  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async getActiveStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.isActive, true));
  }

  async createStaff(staffMember: CreateStaffRequest): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffMember).returning();
    return newStaff;
  }

  async updateStaff(id: number, updates: UpdateStaffRequest): Promise<Staff> {
    const [updated] = await db.update(staff).set(updates).where(eq(staff.id, id)).returning();
    return updated;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // SMS Notification methods
  async getSmsNotifications(eventId: number): Promise<SmsNotification[]> {
    return await db.select().from(smsNotifications).where(eq(smsNotifications.eventId, eventId));
  }

  async createSmsNotifications(notifications: CreateSmsNotificationRequest[]): Promise<SmsNotification[]> {
    return await db.insert(smsNotifications).values(notifications).returning();
  }

  async updateSmsNotification(id: number, updates: Partial<SmsNotification>): Promise<SmsNotification> {
    const [updated] = await db.update(smsNotifications).set(updates).where(eq(smsNotifications.id, id)).returning();
    return updated;
  }

  // Expense methods
  async getExpenses(eventId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.eventId, eventId));
  }

  async createExpense(expense: CreateExpenseRequest): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, updates: UpdateExpenseRequest): Promise<Expense> {
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Event Template methods
  async getEventTemplates(): Promise<EventTemplate[]> {
    return await db.select().from(eventTemplates);
  }

  async getEventTemplate(id: number): Promise<EventTemplate | undefined> {
    const [template] = await db.select().from(eventTemplates).where(eq(eventTemplates.id, id));
    return template;
  }

  async createEventTemplate(template: CreateEventTemplateRequest): Promise<EventTemplate> {
    const [newTemplate] = await db.insert(eventTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEventTemplate(id: number, updates: UpdateEventTemplateRequest): Promise<EventTemplate> {
    const [updated] = await db.update(eventTemplates).set(updates).where(eq(eventTemplates.id, id)).returning();
    return updated;
  }

  async deleteEventTemplate(id: number): Promise<void> {
    await db.delete(eventTemplates).where(eq(eventTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
