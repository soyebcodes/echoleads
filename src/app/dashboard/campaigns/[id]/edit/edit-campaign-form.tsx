"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateCampaign } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  leadType: z.enum(["product", "service"]),
  timeFilterDays: z.string().default("7"),
  minLikes: z.string().default("0"),
  minComments: z.string().default("0"),
  targetDescription: z.string().optional(),
  excludeDescription: z.string().optional(),
  keywords: z.array(z.object({
    phrase: z.string().min(2),
    isNegative: z.boolean().default(false),
  })).min(1, "Add at least one positive keyword"),
  voiceSamples: z.array(z.object({
    samplePostContext: z.string().min(10),
    userReply: z.string().min(10),
  })).min(1, "Add at least one voice sample"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;
type CampaignData = {
  id: string;
  name: string;
  description?: string | null;
  leadType: string;
  timeFilterDays?: number | null;
  minLikes?: number | null;
  minComments?: number | null;
  targetDescription?: string | null;
  excludeDescription?: string | null;
  keywords: Array<{ phrase: string; isNegative: boolean }>;
  voiceSamples: Array<{ samplePostContext: string; userReply: string }>;
};

const STEPS = ["Basics", "Keywords", "Targeting", "Voice"];

export default function EditCampaignForm({ campaign }: { campaign: CampaignData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign.name,
      description: campaign.description ?? "",
      leadType: (campaign.leadType as "product" | "service") ?? "product",
      timeFilterDays: String(campaign.timeFilterDays ?? 7),
      minLikes: String(campaign.minLikes ?? 0),
      minComments: String(campaign.minComments ?? 0),
      targetDescription: campaign.targetDescription ?? "",
      excludeDescription: campaign.excludeDescription ?? "",
      keywords: campaign.keywords.length > 0
        ? campaign.keywords.map(k => ({ phrase: k.phrase, isNegative: k.isNegative }))
        : [{ phrase: "", isNegative: false }],
      voiceSamples: campaign.voiceSamples.length > 0
        ? campaign.voiceSamples.map(v => ({ samplePostContext: v.samplePostContext, userReply: v.userReply }))
        : [{ samplePostContext: "", userReply: "" }],
    },
  });

  const { fields: keywordFields, append: appendKeyword, remove: removeKeyword } = useFieldArray({
    control,
    name: "keywords",
  });

  const { fields: voiceFields, append: appendVoice, remove: removeVoice } = useFieldArray({
    control,
    name: "voiceSamples",
  });

  const onSubmit = async (data: CampaignFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateCampaign(campaign.id, data);
      if (result.success) {
        toast.success("Campaign updated successfully!");
        router.push(`/dashboard/campaigns/${campaign.id}`);
      } else {
        toast.error(result.error || "Failed to update campaign");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadType = watch("leadType");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }}
      className="space-y-10"
    >
      <Card className="bg-card border-border shadow-soft">
        <CardContent className="pt-8 space-y-6">
          <div>
            <h3 className="text-display text-lg font-medium mb-4">Campaign Basics</h3>
          </div>
          <div>
            <Label className="text-foreground">Campaign Name *</Label>
            <Input {...register("name")} className="bg-surface border-border text-foreground mt-1.5" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label className="text-foreground">Description</Label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="What does your product/service do?"
              className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground mt-1.5"
            />
          </div>
          <div>
            <Label className="text-foreground mb-3 block">Campaign Type *</Label>
            <div className="grid grid-cols-2 gap-4">
              {(["product", "service"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue("leadType", type)}
                  className={`py-4 px-5 rounded-xl border-2 text-left transition-all ${
                    leadType === type
                      ? "border-ember bg-ember-soft text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-ember/50"
                  }`}
                >
                  <div className="font-semibold capitalize mb-1">{type}</div>
                  <div className="text-xs opacity-70">
                    {type === "product" ? "SaaS, app, or tool" : "Agency, freelance, or consulting"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="pt-8 space-y-6">
          <div>
            <h3 className="text-display text-lg font-medium">Keywords</h3>
            <p className="text-sm text-muted-foreground mt-1">Positive keywords trigger lead capture. Negative keywords exclude irrelevant posts.</p>
          </div>
          <div className="space-y-3">
            {keywordFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface">
                <button
                  type="button"
                  onClick={() => {
                    const current = watch(`keywords.${index}.isNegative`);
                    setValue(`keywords.${index}.isNegative`, !current);
                  }}
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                    watch(`keywords.${index}.isNegative`)
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {watch(`keywords.${index}.isNegative`) ? "− Neg" : "+ Pos"}
                </button>
                <Input
                  {...register(`keywords.${index}.phrase`)}
                  placeholder="e.g. looking for developer"
                  className="bg-transparent border-none text-foreground text-sm flex-1 p-0 h-auto focus-visible:ring-0"
                />
                <button type="button" onClick={() => removeKeyword(index)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {errors.keywords && <p className="text-red-400 text-xs">{String(errors.keywords.message)}</p>}
          </div>
          <Button type="button" variant="outline" onClick={() => appendKeyword({ phrase: "", isNegative: false })}
            className="w-full border-dashed border-border text-muted-foreground hover:border-ember/50">
            <Plus className="w-4 h-4 mr-2" /> Add Keyword
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="pt-8 space-y-6">
          <h3 className="text-display text-lg font-medium">Targeting Filters</h3>
          <div>
            <Label className="text-foreground mb-3 block">Recency Filter</Label>
            <div className="grid grid-cols-4 gap-3">
              {[{ label: "24h", value: "1" }, { label: "7 days", value: "7" }, { label: "30 days", value: "30" }, { label: "90 days", value: "90" }].map(({ label, value }) => {
                const current = watch("timeFilterDays");
                return (
                  <button key={value} type="button" onClick={() => setValue("timeFilterDays", value)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      current === value ? "border-ember bg-ember-soft text-foreground" : "border-border bg-surface text-muted-foreground hover:border-ember/50"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-foreground">Min Likes</Label>
              <Input type="number" {...register("minLikes")} className="bg-surface border-border text-foreground mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Min Comments</Label>
              <Input type="number" {...register("minComments")} className="bg-surface border-border text-foreground mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-foreground">Target Customer Description</Label>
            <textarea {...register("targetDescription")} rows={3}
              placeholder="e.g. Founders looking for sales automation tools"
              className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground mt-1.5" />
          </div>
          <div>
            <Label className="text-foreground">Exclude Keywords/Context</Label>
            <textarea {...register("excludeDescription")} rows={3}
              placeholder="e.g. Free tools, open source, hobby projects"
              className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground mt-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="pt-8 space-y-6">
          <div>
            <h3 className="text-display text-lg font-medium">Your Voice Samples</h3>
            <p className="text-sm text-muted-foreground">Train the AI on how you reply to leads.</p>
          </div>
          <div className="space-y-8">
            {voiceFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-border rounded-xl bg-surface space-y-4 relative">
                <button type="button" onClick={() => removeVoice(index)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Post Context</Label>
                  <textarea
                    {...register(`voiceSamples.${index}.samplePostContext`)}
                    rows={2}
                    placeholder="e.g. Someone asking for a recommendation on r/startups"
                    className="w-full bg-transparent border-none text-foreground text-sm focus:ring-0 mt-1 resize-none placeholder:text-muted-foreground/50"
                  />
                  {errors.voiceSamples?.[index]?.samplePostContext && (
                    <p className="text-red-400 text-xs mt-1">{errors.voiceSamples[index]?.samplePostContext?.message}</p>
                  )}
                </div>
                <div className="pt-4 border-t border-border">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Your Reply</Label>
                  <textarea
                    {...register(`voiceSamples.${index}.userReply`)}
                    rows={3}
                    placeholder="e.g. Hey! I actually built [product] for exactly this..."
                    className="w-full bg-transparent border-none text-ember text-sm focus:ring-0 mt-1 resize-none italic placeholder:text-muted-foreground/50"
                  />
                  {errors.voiceSamples?.[index]?.userReply && (
                    <p className="text-red-400 text-xs mt-1">{errors.voiceSamples[index]?.userReply?.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => appendVoice({ samplePostContext: "", userReply: "" })}
            className="w-full border-dashed border-border text-muted-foreground hover:border-ember/50">
            <Plus className="w-4 h-4 mr-2" /> Add Voice Sample
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 pb-12">
        <Button type="submit" disabled={isSubmitting} className="bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 px-8 py-6 text-lg w-full md:w-auto">
          {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes…</> : "Save Campaign"}
        </Button>
      </div>
    </form>
  );
}
