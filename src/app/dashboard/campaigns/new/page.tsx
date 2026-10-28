import CampaignWizard from "./campaign-wizard";
import { getBillingOverview } from "@/app/actions/billing";
import { getPlan } from "@/lib/billing/plans";
import { isXAvailableForScanning } from "@/lib/scanner-config";

export default async function NewCampaignPage() {
  const overview = await getBillingOverview();
  const plan = getPlan(overview?.planId ?? "free");

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">Create New Campaign</h1>
        <p className="text-sm text-muted-foreground">Set up your targeting and AI persona to start finding leads.</p>
      </div>

      <CampaignWizard
        allowedPlatforms={plan.platforms}
        xConfigured={isXAvailableForScanning()}
      />
    </div>
  );
}