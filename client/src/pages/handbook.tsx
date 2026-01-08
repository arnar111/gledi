import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function HandbookPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold">Social Committee Handbook</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. General Objectives</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <p>The goal of the social committee is to create a positive atmosphere and promote good spirits among employees through various social events.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Event Categories</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <ul>
            <li><strong>Quarterly Fun Days:</strong> Large scale events held four times a year.</li>
            <li><strong>Weekly Socials:</strong> Smaller gatherings like "Pizza Friday" or "Coffee & Cake".</li>
            <li><strong>Special Interest:</strong> Sport groups, board game nights, or hiking trips.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Planning Procedures</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <ol>
            <li>Brainstorm ideas in a dedicated Microsoft Loop workspace.</li>
            <li>Define budget and get approval from management.</li>
            <li>Assign tasks (posters, catering, booking) in the Gleðinefnd portal.</li>
            <li>Announce on Slack using the AI-generated poster.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
