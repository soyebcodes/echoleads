import { getCampaigns } from "@/app/actions/campaigns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CampaignsList from "./campaigns-list";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-3xl font-bold tracking-tight mb-2">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage your Reddit monitoring campaigns.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-ember text-ember-foreground shadow-ember hover:bg-ember/90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Campaign
          </Button>
        </Link>
      </div>

      <CampaignsList initialCampaigns={campaigns as any[]} />
    </div>
  );
}
