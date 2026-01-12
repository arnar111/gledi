// Firestore Storage - all PostgreSQL/Drizzle code has been replaced
import {
  type User, type Event, type Meeting, type Task, type Staff, type SmsNotification, type Expense, type EventTemplate,
  type CreateEventRequest, type UpdateEventRequest,
  type CreateMeetingRequest, type UpdateMeetingRequest,
  type CreateTaskRequest, type UpdateTaskRequest,
  type CreateStaffRequest, type UpdateStaffRequest,
  type CreateSmsNotificationRequest,
  type CreateExpenseRequest, type UpdateExpenseRequest,
  type CreateEventTemplateRequest, type UpdateEventTemplateRequest,
} from "@shared/schema";

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

// Use Firestore storage
import { FirestoreStorage } from "./firestore-storage";

export const storage: IStorage = new FirestoreStorage();
