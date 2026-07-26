"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLeadsByCampaign } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function ClearAllLeadsButton({
  campaignId,
  totalLeads,
}: {
  campaignId: string;
  totalLeads: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClear = () => {
    startTransition(async () => {
      await deleteLeadsByCampaign(campaignId);
      setOpen(false);
      router.refresh();
    });
  };

  if (totalLeads === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Leads
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Clear all {totalLeads} lead{totalLeads !== 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This will permanently delete all leads matched to this campaign.
            This action cannot be undone. You can always re-run the scan to
            find new leads.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-foreground hover:bg-accent">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleClear}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete All Leads"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
