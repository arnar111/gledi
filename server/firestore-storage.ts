import { db, Timestamp } from './firebase';
import type {
    User, Event, Meeting, Task, Staff, SmsNotification, Expense, EventTemplate,
    CreateEventRequest, UpdateEventRequest,
    CreateMeetingRequest, UpdateMeetingRequest,
    CreateTaskRequest, UpdateTaskRequest,
    CreateStaffRequest, UpdateStaffRequest,
    CreateSmsNotificationRequest,
    CreateExpenseRequest, UpdateExpenseRequest,
    CreateEventTemplateRequest, UpdateEventTemplateRequest,
} from '@shared/schema';

// Timestamp type alias
type TimestampType = InstanceType<typeof Timestamp>;

// Collection names
const COLLECTIONS = {
    users: 'users',
    events: 'events',
    meetings: 'meetings',
    tasks: 'tasks',
    staff: 'staff',
    smsNotifications: 'sms_notifications',
    expenses: 'expenses',
    eventTemplates: 'event_templates',
} as const;

// Helper to convert Firestore Timestamp to Date
function toDate(timestamp: TimestampType | Date | undefined | null): Date | null {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp;
}

// Helper to prepare data for Firestore (convert Dates to Timestamps)
function prepareForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
            result[key] = Timestamp.fromDate(value);
        } else if (value === undefined) {
            // Skip undefined values
        } else {
            result[key] = value;
        }
    }
    return result;
}

// Counter for generating auto-increment IDs
async function getNextId(collectionName: string): Promise<number> {
    const counterRef = db.collection('_counters').doc(collectionName);

    return await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextId = 1;

        if (counterDoc.exists) {
            nextId = (counterDoc.data()?.value || 0) + 1;
        }

        transaction.set(counterRef, { value: nextId });
        return nextId;
    });
}

export class FirestoreStorage {
    // ===== Users =====
    async getUser(id: number): Promise<User | undefined> {
        const snapshot = await db.collection(COLLECTIONS.users)
            .where('id', '==', id)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return snapshot.docs[0].data() as User;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const snapshot = await db.collection(COLLECTIONS.users)
            .where('username', '==', username)
            .limit(1)
            .get();

        if (snapshot.empty) return undefined;
        return snapshot.docs[0].data() as User;
    }

    async createUser(user: any): Promise<User> {
        const id = await getNextId(COLLECTIONS.users);
        const newUser = { ...user, id };
        await db.collection(COLLECTIONS.users).doc(String(id)).set(newUser);
        return newUser as User;
    }

    // ===== Events =====
    async getEvents(): Promise<Event[]> {
        const snapshot = await db.collection(COLLECTIONS.events).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: toDate(data.date),
                createdAt: toDate(data.createdAt),
            } as Event;
        });
    }

    async getEvent(id: number): Promise<Event | undefined> {
        const doc = await db.collection(COLLECTIONS.events).doc(String(id)).get();
        if (!doc.exists) return undefined;
        const data = doc.data()!;
        return {
            ...data,
            date: toDate(data.date),
            createdAt: toDate(data.createdAt),
        } as Event;
    }

    async createEvent(event: CreateEventRequest): Promise<Event> {
        const id = await getNextId(COLLECTIONS.events);
        const now = Timestamp.now();
        const newEvent = prepareForFirestore({
            ...event,
            id,
            createdAt: now,
        });
        await db.collection(COLLECTIONS.events).doc(String(id)).set(newEvent);
        return {
            ...event,
            id,
            createdAt: now.toDate(),
        } as Event;
    }

    async updateEvent(id: number, updates: UpdateEventRequest): Promise<Event> {
        const docRef = db.collection(COLLECTIONS.events).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        return this.getEvent(id) as Promise<Event>;
    }

    // ===== Meetings =====
    async getMeetings(): Promise<Meeting[]> {
        const snapshot = await db.collection(COLLECTIONS.meetings).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: toDate(data.date),
                createdAt: toDate(data.createdAt),
            } as Meeting;
        });
    }

    async createMeeting(meeting: CreateMeetingRequest): Promise<Meeting> {
        const id = await getNextId(COLLECTIONS.meetings);
        const now = Timestamp.now();
        const newMeeting = prepareForFirestore({
            ...meeting,
            id,
            createdAt: now,
        });
        await db.collection(COLLECTIONS.meetings).doc(String(id)).set(newMeeting);
        return {
            ...meeting,
            id,
            createdAt: now.toDate(),
        } as Meeting;
    }

    async updateMeeting(id: number, updates: UpdateMeetingRequest): Promise<Meeting> {
        const docRef = db.collection(COLLECTIONS.meetings).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            date: toDate(data.date),
            createdAt: toDate(data.createdAt),
        } as Meeting;
    }

    // ===== Tasks =====
    async getTasks(): Promise<Task[]> {
        const snapshot = await db.collection(COLLECTIONS.tasks).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                dueDate: toDate(data.dueDate),
            } as Task;
        });
    }

    async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
        const docRef = db.collection(COLLECTIONS.tasks).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            dueDate: toDate(data.dueDate),
        } as Task;
    }

    // ===== Staff =====
    async getStaff(): Promise<Staff[]> {
        const snapshot = await db.collection(COLLECTIONS.staff).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: toDate(data.createdAt),
            } as Staff;
        });
    }

    async getActiveStaff(): Promise<Staff[]> {
        const snapshot = await db.collection(COLLECTIONS.staff)
            .where('isActive', '==', true)
            .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: toDate(data.createdAt),
            } as Staff;
        });
    }

    async createStaff(staffMember: CreateStaffRequest): Promise<Staff> {
        const id = await getNextId(COLLECTIONS.staff);
        const now = Timestamp.now();
        const newStaff = prepareForFirestore({
            ...staffMember,
            id,
            createdAt: now,
        });
        await db.collection(COLLECTIONS.staff).doc(String(id)).set(newStaff);
        return {
            ...staffMember,
            id,
            createdAt: now.toDate(),
        } as Staff;
    }

    async updateStaff(id: number, updates: UpdateStaffRequest): Promise<Staff> {
        const docRef = db.collection(COLLECTIONS.staff).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            createdAt: toDate(data.createdAt),
        } as Staff;
    }

    async deleteStaff(id: number): Promise<void> {
        await db.collection(COLLECTIONS.staff).doc(String(id)).delete();
    }

    // ===== SMS Notifications =====
    async getSmsNotifications(eventId: number): Promise<SmsNotification[]> {
        const snapshot = await db.collection(COLLECTIONS.smsNotifications)
            .where('eventId', '==', eventId)
            .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                sentAt: toDate(data.sentAt),
                createdAt: toDate(data.createdAt),
            } as SmsNotification;
        });
    }

    async createSmsNotifications(notifications: CreateSmsNotificationRequest[]): Promise<SmsNotification[]> {
        const now = Timestamp.now();
        const results: SmsNotification[] = [];

        for (const notification of notifications) {
            const id = await getNextId(COLLECTIONS.smsNotifications);
            const docRef = db.collection(COLLECTIONS.smsNotifications).doc(String(id));
            const newNotification = prepareForFirestore({
                ...notification,
                id,
                createdAt: now,
                sentAt: null,
            });
            await docRef.set(newNotification);
            results.push({
                ...notification,
                id,
                createdAt: now.toDate(),
                sentAt: null,
            } as SmsNotification);
        }

        return results;
    }

    async updateSmsNotification(id: number, updates: Partial<SmsNotification>): Promise<SmsNotification> {
        const docRef = db.collection(COLLECTIONS.smsNotifications).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            sentAt: toDate(data.sentAt),
            createdAt: toDate(data.createdAt),
        } as SmsNotification;
    }

    // ===== Expenses =====
    async getExpenses(eventId: number): Promise<Expense[]> {
        const snapshot = await db.collection(COLLECTIONS.expenses)
            .where('eventId', '==', eventId)
            .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                paidAt: toDate(data.paidAt),
                createdAt: toDate(data.createdAt),
            } as Expense;
        });
    }

    async createExpense(expense: CreateExpenseRequest): Promise<Expense> {
        const id = await getNextId(COLLECTIONS.expenses);
        const now = Timestamp.now();
        const newExpense = prepareForFirestore({
            ...expense,
            id,
            createdAt: now,
        });
        await db.collection(COLLECTIONS.expenses).doc(String(id)).set(newExpense);
        return {
            ...expense,
            id,
            createdAt: now.toDate(),
        } as Expense;
    }

    async updateExpense(id: number, updates: UpdateExpenseRequest): Promise<Expense> {
        const docRef = db.collection(COLLECTIONS.expenses).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            paidAt: toDate(data.paidAt),
            createdAt: toDate(data.createdAt),
        } as Expense;
    }

    async deleteExpense(id: number): Promise<void> {
        await db.collection(COLLECTIONS.expenses).doc(String(id)).delete();
    }

    // ===== Event Templates =====
    async getEventTemplates(): Promise<EventTemplate[]> {
        const snapshot = await db.collection(COLLECTIONS.eventTemplates).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: toDate(data.createdAt),
            } as EventTemplate;
        });
    }

    async getEventTemplate(id: number): Promise<EventTemplate | undefined> {
        const doc = await db.collection(COLLECTIONS.eventTemplates).doc(String(id)).get();
        if (!doc.exists) return undefined;
        const data = doc.data()!;
        return {
            ...data,
            createdAt: toDate(data.createdAt),
        } as EventTemplate;
    }

    async createEventTemplate(template: CreateEventTemplateRequest): Promise<EventTemplate> {
        const id = await getNextId(COLLECTIONS.eventTemplates);
        const now = Timestamp.now();
        const newTemplate = prepareForFirestore({
            ...template,
            id,
            createdAt: now,
        });
        await db.collection(COLLECTIONS.eventTemplates).doc(String(id)).set(newTemplate);
        return {
            ...template,
            id,
            createdAt: now.toDate(),
        } as EventTemplate;
    }

    async updateEventTemplate(id: number, updates: UpdateEventTemplateRequest): Promise<EventTemplate> {
        const docRef = db.collection(COLLECTIONS.eventTemplates).doc(String(id));
        await docRef.update(prepareForFirestore(updates));
        const doc = await docRef.get();
        const data = doc.data()!;
        return {
            ...data,
            createdAt: toDate(data.createdAt),
        } as EventTemplate;
    }

    async deleteEventTemplate(id: number): Promise<void> {
        await db.collection(COLLECTIONS.eventTemplates).doc(String(id)).delete();
    }
}
