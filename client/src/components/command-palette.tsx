import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { api } from "@shared/routes"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PartyPopper, Calendar, Book, FileText, Search } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation()

  const { data: events } = useQuery({
    queryKey: [api.events.list.path],
  })

  const { data: meetings } = useQuery({
    queryKey: [api.meetings.list.path],
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  const handbookSections = [
    { title: "Committee Rules", description: "Guidelines for committee operations" },
    { title: "Event Planning", description: "How to plan successful events" },
    { title: "Budget Management", description: "Managing event budgets" },
    { title: "Communication", description: "Team communication guidelines" },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search events, meetings, handbook..." data-testid="search-input" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => setLocation("/"))} data-testid="cmd-page-events">
            <PartyPopper className="mr-2 h-4 w-4" />
            <span>Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/meetings"))} data-testid="cmd-page-meetings">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Meetings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/handbook"))} data-testid="cmd-page-handbook">
            <Book className="mr-2 h-4 w-4" />
            <span>Handbook</span>
          </CommandItem>
        </CommandGroup>

        {events && Array.isArray(events) && events.length > 0 && (
          <CommandGroup heading="Events">
            {events.map((event: any) => (
              <CommandItem 
                key={event.id} 
                onSelect={() => runCommand(() => setLocation("/"))}
                data-testid={`cmd-event-${event.id}`}
              >
                <PartyPopper className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{event.title}</span>
                  <span className="text-xs text-muted-foreground">{event.description?.slice(0, 50)}...</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {meetings && Array.isArray(meetings) && meetings.length > 0 && (
          <CommandGroup heading="Meetings">
            {meetings.map((meeting: any) => (
              <CommandItem 
                key={meeting.id} 
                onSelect={() => runCommand(() => setLocation("/meetings"))}
                data-testid={`cmd-meeting-${meeting.id}`}
              >
                <Calendar className="mr-2 h-4 w-4 text-secondary" />
                <div className="flex flex-col">
                  <span>{meeting.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(meeting.date).toLocaleDateString()}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Handbook">
          {handbookSections.map((section) => (
            <CommandItem 
              key={section.title} 
              onSelect={() => runCommand(() => setLocation("/handbook"))}
              data-testid={`cmd-handbook-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{section.title}</span>
                <span className="text-xs text-muted-foreground">{section.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
