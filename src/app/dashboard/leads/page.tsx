import { getPaginatedLeads } from "@/app/actions/leads";
import LeadsTable from "./leads-table";

type LeadsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await getPaginatedLeads(page);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-display text-3xl font-bold tracking-tight mb-2">Leads Inbox</h1>
        <p className="text-sm text-muted-foreground">High-intent Reddit posts matched to your campaigns.</p>
      </div>

      <LeadsTable
        key={result.page}
        initialLeads={result.leads}
        pagination={{
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        }}
      />
    </div>
  );
}
