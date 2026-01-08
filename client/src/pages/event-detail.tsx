import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildUrl } from "@shared/routes";
import type { Event, Expense } from "@shared/schema";
import { expenseCategories } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, ArrowLeft, Calendar, MapPin, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatISK(amount: number): string {
  return amount.toLocaleString("is-IS") + " ISK";
}

export default function EventDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const eventId = parseInt(params.id || "0", 10);
  
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "" as typeof expenseCategories[number] | "",
    vendor: "",
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  const event = events?.find((e) => e.id === eventId);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: [`/api/events/${eventId}/expenses`],
    enabled: !!eventId,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { description: string; amount: number; category: typeof expenseCategories[number]; vendor: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/expenses`] });
      toast({ title: "Expense added successfully!" });
      closeExpenseDialog();
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/expenses`] });
      toast({ title: "Expense deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const closeExpenseDialog = () => {
    setExpenseDialogOpen(false);
    setNewExpense({ description: "", amount: "", category: "", vendor: "" });
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return;
    createExpenseMutation.mutate({
      description: newExpense.description,
      amount: parseInt(newExpense.amount, 10),
      category: newExpense.category as typeof expenseCategories[number],
      vendor: newExpense.vendor,
    });
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budget = event?.budget || 0;
  const spentPercentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const isOverBudget = totalSpent > budget;

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" data-testid="loading-event-detail">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-event-detail">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold" data-testid="text-event-title">{event.title}</h2>
          <p className="text-muted-foreground mt-1" data-testid="text-event-subtitle">Event Details</p>
        </div>
        <Badge 
          variant={event.status === "planning" ? "secondary" : "default"}
          data-testid="badge-event-status"
        >
          {event.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1" data-testid="card-event-info">
          <CardHeader>
            <CardTitle className="text-lg">Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm" data-testid="text-event-date">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.date).toLocaleDateString("is-IS", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm" data-testid="text-event-location">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="flex items-start gap-2 text-sm" data-testid="text-event-description">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{event.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-budget">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Budget Tracking</CardTitle>
              <CardDescription>
                {formatISK(totalSpent)} of {formatISK(budget)} spent
              </CardDescription>
            </div>
            <Button 
              onClick={() => setExpenseDialogOpen(true)}
              className="gap-2"
              data-testid="button-add-expense"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className={isOverBudget ? "text-destructive font-medium" : ""} data-testid="text-spent-amount">
                  {formatISK(totalSpent)}
                </span>
              </div>
              <Progress 
                value={spentPercentage} 
                className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                data-testid="progress-budget"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"} data-testid="text-remaining-amount">
                  {formatISK(Math.max(budget - totalSpent, 0))}
                  {isOverBudget && ` (${formatISK(totalSpent - budget)} over)`}
                </span>
              </div>
            </div>

            {expensesLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-expenses">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-expenses">
                <p>No expenses recorded yet.</p>
                <p className="text-sm">Click "Add Expense" to start tracking.</p>
              </div>
            ) : (
              <Table data-testid="table-expenses">
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                      <TableCell data-testid={`text-expense-description-${expense.id}`}>
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize" data-testid={`badge-expense-category-${expense.id}`}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-expense-vendor-${expense.id}`}>
                        {expense.vendor || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium" data-testid={`text-expense-amount-${expense.id}`}>
                        {formatISK(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          {deleteExpenseMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-expense-dialog-title">Add Expense</DialogTitle>
            <DialogDescription data-testid="text-expense-dialog-description">
              Record a new expense for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="What was purchased?"
                data-testid="input-expense-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (ISK)</Label>
              <Input
                id="expense-amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0"
                data-testid="input-expense-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value as typeof expenseCategories[number] })}
              >
                <SelectTrigger id="expense-category" data-testid="select-expense-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize" data-testid={`option-category-${cat}`}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-vendor">Vendor (optional)</Label>
              <Input
                id="expense-vendor"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                placeholder="Store or vendor name"
                data-testid="input-expense-vendor"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeExpenseDialog} data-testid="button-cancel-expense">
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={createExpenseMutation.isPending || !newExpense.description || !newExpense.amount || !newExpense.category}
              className="gap-2"
              data-testid="button-submit-expense"
            >
              {createExpenseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
