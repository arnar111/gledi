import { db } from "./db";
import {
  users, events, meetings, tasks, eventAttendees, staff, smsNotifications,
  type User, type Event, type Meeting, type Task, type Staff, type SmsNotification,
  type CreateEventRequest, type UpdateEventRequest,
  type CreateMeetingRequest, type UpdateMeetingRequest,
  type CreateTaskRequest, type UpdateTaskRequest,
  type CreateStaffRequest, type UpdateStaffRequest,
  type CreateSmsNotificationRequest,
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
}

export const storage = new DatabaseStorage();
