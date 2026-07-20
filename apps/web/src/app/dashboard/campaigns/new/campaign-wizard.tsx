"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCampaign } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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

const STEPS = ["Basics", "Keywords", "Targeting", "Voice"];

export default function CampaignWizard() {
  const [currentStep, setCurrentStep] = useState(0);
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
      leadType: "product",
      keywords: [{ phrase: "", isNegative: false }],
      voiceSamples: [{
        samplePostContext: "Someone asking for a recommendation for a [your product/service category] on r/software.",
        userReply: "Hey! I actually built [EchoLeads] for exactly this. It helps you [monitor reddit]. Happy to share more if you're interested!"
      }],
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
      const result = await createCampaign(data);
      if (result.success) {
        toast.success("Campaign created successfully!");
        router.push("/dashboard/campaigns");
      } else {
        toast.error(result.error || "Failed to create campaign");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const leadType = watch("leadType");

  return (
    <div className="space-y-8 pb-20">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12">
        {STEPS.map((step, i) => (
          <div key={step} className="flex-1 flex items-center">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${i <= currentStep
                    ? "bg-ember border-ember text-ember-foreground"
                    : "border-border text-muted-foreground"
                  }`}
              >
                {i < currentStep ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap ${i <= currentStep ? "text-ember" : "text-muted-foreground"
                }`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${i < currentStep ? "bg-ember" : "bg-border"
                }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-card border-border shadow-soft overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Basics */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Campaign Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g. EchoLeads Launch"
                      className="bg-surface border-border text-foreground mt-1.5"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={3}
                      placeholder="What are you promoting?"
                      className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">I am promoting a...</Label>
                    <div className="flex gap-4">
                      {["product", "service"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue("leadType", type as any)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${leadType === type
                              ? "border-ember bg-ember-soft text-foreground"
                              : "border-border bg-surface text-muted-foreground hover:border-ember/50"
                            }`}
                        >
                          <span className="capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Keywords */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-display text-lg font-medium">Keywords</h3>
                    <p className="text-sm text-muted-foreground">Add phrases that indicate high intent. Use negative keywords to filter out noise.</p>
                  </div>
                  <div className="space-y-3">
                    {keywordFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-center group">
                        <Input
                          {...register(`keywords.${index}.phrase`)}
                          placeholder="e.g. reddit lead software"
                          className="bg-surface border-border text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setValue(`keywords.${index}.isNegative`, !watch(`keywords.${index}.isNegative`))}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${watch(`keywords.${index}.isNegative`)
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}
                        >
                          {watch(`keywords.${index}.isNegative`) ? "Negative" : "Positive"}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyword(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendKeyword({ phrase: "", isNegative: false })}
                    className="mt-4 border-border text-foreground hover:bg-accent"
                  >
                    Add Keyword
                  </Button>
                  {errors.keywords && <p className="text-red-400 text-xs mt-2">{errors.keywords.message}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Targeting */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-foreground block mb-2">Recency Filter</Label>
                    <p className="text-xs text-muted-foreground mb-3">Only find Reddit posts created within this time window.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "24 Hours", value: "1" },
                        { label: "7 Days", value: "7" },
                        { label: "30 Days", value: "30" },
                        { label: "90 Days", value: "90" },
                      ].map(({ label, value }) => {
                        const current = watch("timeFilterDays");
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue("timeFilterDays", value)}
                            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${current === value
                                ? "border-ember bg-ember-soft text-foreground"
                                : "border-border bg-surface text-muted-foreground hover:border-ember/50"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-foreground">Min Likes</Label>
                      <Input
                        type="number"
                        {...register("minLikes")}
                        className="bg-surface border-border text-foreground mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Min Comments</Label>
                      <Input
                        type="number"
                        {...register("minComments")}
                        className="bg-surface border-border text-foreground mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-foreground">Target Customer Description</Label>
                    <textarea
                      {...register("targetDescription")}
                      rows={3}
                      placeholder="e.g. Founders looking for sales automation tools"
                      className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Exclude Keywords/Context</Label>
                  <textarea
                    {...register("excludeDescription")}
                    rows={3}
                    placeholder="e.g. Free tools, open source, hobby projects"
                    className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground mt-1.5"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Voice */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-display text-lg font-medium">Your Voice Samples</h3>
                  <p className="text-sm text-muted-foreground">Train the AI on how you reply to leads. Provide context and your typical response.</p>
                </div>
                <div className="space-y-8">
                  {voiceFields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-border rounded-xl bg-surface space-y-4 relative">
                      <button
                        type="button"
                        onClick={() => removeVoice(index)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Post Context</Label>
                        <textarea
                          {...register(`voiceSamples.${index}.samplePostContext`)}
                          rows={2}
                          className="w-full bg-transparent border-none text-foreground text-sm focus:ring-0 mt-1 resize-none"
                        />
                      </div>
                      <div className="pt-4 border-t border-border">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Your Reply</Label>
                        <textarea
                          {...register(`voiceSamples.${index}.userReply`)}
                          rows={3}
                          className="w-full bg-transparent border-none text-ember text-sm focus:ring-0 mt-1 resize-none italic"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendVoice({ samplePostContext: "", userReply: "" })}
                  className="w-full border-dashed border-border text-muted-foreground hover:border-ember/50"
                >
                  Add Voice Sample
                </Button>
                {errors.voiceSamples && <p className="text-red-400 text-xs mt-2">{errors.voiceSamples.message}</p>}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 px-8"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 px-8"
                >
                  {isSubmitting ? "Generating Campaign…" : "Create Campaign"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Toast provider needed if not at root */}
    </div>
  );
}
