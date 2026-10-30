import Link from "next/link";
import { redirect } from "next/navigation";
import { getBillingOverview } from "@/app/actions/billing";
import { PLANS } from "@/lib/billing/plans";
import BillingPlans from "./billing-plans";
import { ArrowLeft, CreditCard } from "lucide-react";

type Props = {
  searchParams: Promise<{ checkout?: string }>;
};

function UsageMeter({
  label,
  used,
  limit,
  hint,
}: {
  label: string;
  used: number;
  limit: number;
  hint: string;
}) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const nearLimit = percent >= 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${nearLimit ? "text-ember" : "text-foreground"}`}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${nearLimit ? "bg-ember" : "bg-emerald-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default async function BillingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const overview = await getBillingOverview();

  if (!overview) {
    redirect("/login");
  }

  const plan = overview.plan;
  const isFree = overview.planId === "free";
  const plansList = [PLANS.free, PLANS.pro, PLANS.business];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Back to overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-display text-2xl sm:text-3xl font-bold tracking-tight">
              Billing &amp; Usage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {overview.stripeEnabled
                ? "Your plan, quotas, and subscription — billed securely via Stripe."
                : "Your plan and usage. Paid plans are coming soon."}
            </p>
          </div>
        </div>
      </div>

      {sp.checkout === "success" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400">
          Payment successful — your new plan is active. Usage meters refresh instantly.
        </div>
      )}
      {sp.checkout === "canceled" && (
        <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
          Checkout canceled. No charge was made — you can upgrade any time.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-ember-soft text-ember">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-display text-lg font-semibold">
                {plan.name} plan
              </h2>
              <p className="text-xs text-muted-foreground">
                {plan.priceMonthly === 0
                  ? "Free forever — no card required"
                  : `$${plan.priceMonthly}/mo`}
                {overview.currentPeriodEnd
                  ? ` • renews ${new Date(overview.currentPeriodEnd).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isFree
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {overview.subscriptionStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          <UsageMeter
            label="Campaigns"
            used={overview.usage.campaigns.used}
            limit={overview.usage.campaigns.limit}
            hint={`${plan.campaigns} campaign(s) included in ${plan.name}`}
          />
          <UsageMeter
            label="Leads this month"
            used={overview.usage.leads.used}
            limit={overview.usage.leads.limit}
            hint={`${plan.leadsPerMonth.toLocaleString()} leads / month`}
          />
          <UsageMeter
            label="AI replies this month"
            used={overview.usage.aiReplies.used}
            limit={overview.usage.aiReplies.limit}
            hint={`${plan.aiRepliesPerMonth.toLocaleString()} AI reply drafts / month`}
          />
        </div>

        {!isFree && (
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            Need more volume or custom platforms? Contact support from the billing portal.
          </p>
        )}
      </div>

      <BillingPlans
        plans={plansList}
        currentPlanId={overview.planId}
        stripeEnabled={overview.stripeEnabled}
        isFree={isFree}
      />
    </div>
  );
}