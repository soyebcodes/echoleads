import CampaignWizard from "./campaign-wizard";

export default function NewCampaignPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Campaign</h1>
        <p className="text-slate-400">Set up your targeting and AI persona to start finding leads.</p>
      </div>

      <CampaignWizard />
    </div>
  );
}
