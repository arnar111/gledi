import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Calendar, ClipboardList, MessageSquare, Users, Sparkles } from "lucide-react";

const sections = [
  {
    id: 1,
    title: "General Objectives",
    icon: Target,
    color: "from-purple-500 to-indigo-500",
    content: "The goal of the social committee (Gleðinefnd) is to create a positive atmosphere and promote good spirits among employees through various social events. We aim to foster a sense of community and belonging within the workplace.",
  },
  {
    id: 2,
    title: "Event Categories",
    icon: Calendar,
    color: "from-blue-500 to-cyan-500",
    items: [
      { name: "Quarterly Fun Days", desc: "Large scale events held four times a year with company-wide participation." },
      { name: "Weekly Socials", desc: "Smaller gatherings like Pizza Friday or Coffee & Cake sessions." },
      { name: "Special Interest", desc: "Sport groups, board game nights, hiking trips, and hobby clubs." },
    ],
  },
  {
    id: 3,
    title: "Planning Procedures",
    icon: ClipboardList,
    color: "from-emerald-500 to-teal-500",
    steps: [
      "Brainstorm ideas in a dedicated Microsoft Loop workspace",
      "Define budget and get approval from management",
      "Assign tasks (posters, catering, booking) in the portal",
      "Announce on Slack using the AI-generated poster",
      "Track RSVPs and manage attendee list",
      "Execute event and gather feedback",
    ],
  },
  {
    id: 4,
    title: "Communication Guidelines",
    icon: MessageSquare,
    color: "from-orange-500 to-amber-500",
    content: "All event announcements should be posted to the #gledinefnd Slack channel at least 2 weeks before the event. Use the AI poster generator to create eye-catching visuals. For larger events, send SMS reminders through the portal 24 hours before.",
  },
  {
    id: 5,
    title: "Committee Roles",
    icon: Users,
    color: "from-pink-500 to-rose-500",
    roles: [
      { role: "Chairperson", desc: "Leads meetings and oversees all activities" },
      { role: "Secretary", desc: "Takes meeting notes and manages documentation" },
      { role: "Treasurer", desc: "Manages budget and expense tracking" },
      { role: "Event Coordinator", desc: "Plans and executes individual events" },
    ],
  },
];

export default function HandbookPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="page-handbook">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent" data-testid="text-handbook-title">
          Committee Handbook
        </h1>
        <p className="text-muted-foreground mt-3 text-lg" data-testid="text-handbook-subtitle">
          Your guide to running successful workplace events
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary" className="gap-1" data-testid="badge-handbook-updated">
            <Sparkles className="h-3 w-3" /> Updated Jan 2026
          </Badge>
        </div>
      </div>

      <div className="space-y-6" data-testid="list-handbook-sections">
        {sections.map((section) => (
          <Card key={section.id} className="hover-elevate overflow-visible" data-testid={`card-handbook-${section.id}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} text-white shrink-0`} data-testid={`icon-section-${section.id}`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold" data-testid={`text-section-title-${section.id}`}>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.content && (
                <p className="text-muted-foreground leading-relaxed" data-testid={`text-section-content-${section.id}`}>{section.content}</p>
              )}
              
              {section.items && (
                <div className="grid gap-3" data-testid={`list-section-items-${section.id}`}>
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50" data-testid={`item-${section.id}-${idx}`}>
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground" data-testid={`text-item-name-${section.id}-${idx}`}>{item.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-desc-${section.id}-${idx}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {section.steps && (
                <ol className="space-y-2" data-testid={`list-section-steps-${section.id}`}>
                  {section.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3" data-testid={`step-${section.id}-${idx}`}>
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0" data-testid={`step-number-${section.id}-${idx}`}>
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5" data-testid={`text-step-${section.id}-${idx}`}>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              
              {section.roles && (
                <div className="grid sm:grid-cols-2 gap-3" data-testid={`list-section-roles-${section.id}`}>
                  {section.roles.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border/50" data-testid={`role-${section.id}-${idx}`}>
                      <p className="font-semibold text-foreground" data-testid={`text-role-name-${section.id}-${idx}`}>{item.role}</p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-role-desc-${section.id}-${idx}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
