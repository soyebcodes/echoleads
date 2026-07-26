import { getCampaignById } from "@/app/actions/campaigns";
import { notFound } from "next/navigation";
import EditCampaignForm from "./edit-campaign-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) notFound();

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/campaigns/${id}`}>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-display text-2xl font-bold tracking-tight">Edit Campaign</h1>
          <p className="text-sm text-muted-foreground">{campaign.name}</p>
        </div>
      </div>
      <EditCampaignForm campaign={campaign} />
    </div>
  );
}
