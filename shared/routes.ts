import { z } from 'zod';
import { 
  insertEventSchema, 
  insertMeetingSchema, 
  insertTaskSchema,
  insertStaffSchema,
  insertExpenseSchema,
  insertEventTemplateSchema,
  expenseCategories,
  events,
  meetings,
  tasks,
  staff,
  smsNotifications,
  expenses,
  eventTemplates
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: z.object({
        title: z.string(),
        description: z.string().optional().nullable(),
        date: z.string(),
        location: z.string().optional().nullable(),
        status: z.enum(['planning', 'confirmed', 'completed', 'cancelled']).optional(),
        budget: z.number().optional().nullable(),
        maxAttendees: z.number().optional().nullable(),
        posterUrl: z.string().optional().nullable(),
        slackMessageTs: z.string().optional().nullable(),
      }),
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/events/:id',
      input: insertEventSchema.partial(),
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    generatePoster: {
      method: 'POST' as const,
      path: '/api/events/:id/poster',
      input: z.object({ prompt: z.string().optional() }),
      responses: {
        200: z.object({ posterUrl: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  meetings: {
    list: {
      method: 'GET' as const,
      path: '/api/meetings',
      responses: {
        200: z.array(z.custom<typeof meetings.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meetings',
      input: z.object({
        title: z.string(),
        date: z.string(),
        loopLink: z.string().optional().nullable(),
        minutes: z.string().optional().nullable(),
        status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
        chairpersonId: z.number().optional().nullable(),
        secretaryId: z.number().optional().nullable(),
      }),
      responses: {
        201: z.custom<typeof meetings.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/meetings/:id',
      input: insertMeetingSchema.partial(),
      responses: {
        200: z.custom<typeof meetings.$inferSelect>(),
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
      },
    },
  },
  staff: {
    list: {
      method: 'GET' as const,
      path: '/api/staff',
      responses: {
        200: z.array(z.custom<typeof staff.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/staff',
      input: insertStaffSchema,
      responses: {
        201: z.custom<typeof staff.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/staff/:id',
      input: insertStaffSchema.partial(),
      responses: {
        200: z.custom<typeof staff.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/staff/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  smsNotifications: {
    list: {
      method: 'GET' as const,
      path: '/api/events/:eventId/sms',
      responses: {
        200: z.array(z.custom<typeof smsNotifications.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events/:eventId/sms',
      input: z.object({
        message: z.string(),
        staffIds: z.array(z.number()),
      }),
      responses: {
        201: z.array(z.custom<typeof smsNotifications.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/events/:eventId/sms/send',
      responses: {
        200: z.object({ sent: z.number(), failed: z.number() }),
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/events/:eventId/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events/:eventId/expenses',
      input: insertExpenseSchema.omit({ eventId: true }),
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/expenses/:id',
      input: insertExpenseSchema.partial(),
      responses: {
        200: z.custom<typeof expenses.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  eventTemplates: {
    list: {
      method: 'GET' as const,
      path: '/api/templates',
      responses: {
        200: z.array(z.custom<typeof eventTemplates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/templates',
      input: insertEventTemplateSchema,
      responses: {
        201: z.custom<typeof eventTemplates.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/templates/:id',
      input: insertEventTemplateSchema.partial(),
      responses: {
        200: z.custom<typeof eventTemplates.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/templates/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    createEventFromTemplate: {
      method: 'POST' as const,
      path: '/api/templates/:id/create-event',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
