import { getPaginatedLeadsByCampaign } from "@/app/actions/leads";
import { getCampaignById } from "@/app/actions/campaigns";
import LeadsTable from "@/app/dashboard/leads/leads-table";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ClearAllLeadsButton from "./clear-all-leads-button";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function CampaignLeadsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [campaign, result] = await Promise.all([
    getCampaignById(id),
    getPaginatedLeadsByCampaign(id, page),
  ]);

  if (!campaign) notFound();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={"/dashboard/campaigns/" + id}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-display text-3xl font-bold tracking-tight mb-1">
              {campaign.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Leads matched to this campaign — {result.total} total
            </p>
          </div>
        </div>
        <ClearAllLeadsButton campaignId={id} totalLeads={result.total} />
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