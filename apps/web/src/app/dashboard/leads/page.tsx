import { getLeads } from "@/app/actions/leads";
import LeadsTable from "./leads-table";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-display text-3xl font-bold tracking-tight mb-2">Leads Inbox</h1>
        <p className="text-sm text-muted-foreground">High-intent Reddit posts matched to your campaigns.</p>
      </div>

      <LeadsTable initialLeads={leads as any[]} />
    </div>
  );
}
