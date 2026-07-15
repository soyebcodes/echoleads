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
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i <= currentStep
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-slate-800 text-slate-500"
                }`}
              >
                {i < currentStep ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap ${
                i <= currentStep ? "text-indigo-400" : "text-slate-500"
              }`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                i < currentStep ? "bg-indigo-600" : "bg-slate-800"
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-md border-white/5 overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Basics */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-300">Campaign Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g. EchoLeads Launch"
                      className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-300">Description</Label>
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={3}
                      placeholder="What are you promoting?"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">I am promoting a...</Label>
                    <div className="flex gap-4">
                      {["product", "service"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue("leadType", type as any)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                            leadType === type
                              ? "border-indigo-600 bg-indigo-600/10 text-white"
                              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
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
                    <h3 className="text-lg font-medium text-white">Keywords</h3>
                    <p className="text-sm text-slate-400">Add phrases that indicate high intent. Use negative keywords to filter out noise.</p>
                  </div>
                  <div className="space-y-3">
                    {keywordFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-center group">
                        <Input
                          {...register(`keywords.${index}.phrase`)}
                          placeholder="e.g. reddit lead software"
                          className="bg-slate-800/50 border-white/10 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setValue(`keywords.${index}.isNegative`, !watch(`keywords.${index}.isNegative`))}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                            watch(`keywords.${index}.isNegative`)
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
                          className="text-slate-500 hover:text-red-400"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendKeyword({ phrase: "", isNegative: false })}
                    className="mt-4 border-slate-700 text-slate-300 hover:bg-white/5"
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
                  <Label className="text-slate-300 block mb-2">Recency Filter</Label>
                  <p className="text-xs text-slate-500 mb-3">Only find Reddit posts created within this time window.</p>
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
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                            current === value
                              ? "border-indigo-600 bg-indigo-600/10 text-white"
                              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
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
                    <Label className="text-slate-300">Min Likes</Label>
                    <Input
                      type="number"
                      {...register("minLikes")}
                      className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Min Comments</Label>
                    <Input
                      type="number"
                      {...register("minComments")}
                      className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Target Customer Description</Label>
                  <textarea
                    {...register("targetDescription")}
                    rows={3}
                    placeholder="e.g. Founders looking for sales automation tools"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-white mt-1.5"
                  />
                </div>
                </div>
                <div>
                  <Label className="text-slate-300">Exclude Keywords/Context</Label>
                  <textarea
                    {...register("excludeDescription")}
                    rows={3}
                    placeholder="e.g. Free tools, open source, hobby projects"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-white mt-1.5"
                  />
                </div>
              </div>
              </div>
            )}

            {/* Step 4: Voice */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white">Your Voice Samples</h3>
                  <p className="text-sm text-slate-400">Train the AI on how you reply to leads. Provide context and your typical response.</p>
                </div>
                <div className="space-y-8">
                  {voiceFields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-white/5 rounded-xl bg-white/[0.02] space-y-4 relative">
                      <button
                        type="button"
                        onClick={() => removeVoice(index)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                      >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                      </button>
                      <div>
                        <Label className="text-slate-400 text-xs uppercase tracking-wider font-bold">Post Context</Label>
                        <textarea
                          {...register(`voiceSamples.${index}.samplePostContext`)}
                          rows={2}
                          className="w-full bg-transparent border-none text-white text-sm focus:ring-0 mt-1 resize-none"
                        />
                      </div>
                      <div className="pt-4 border-t border-white/[0.05]">
                        <Label className="text-slate-400 text-xs uppercase tracking-wider font-bold">Your Reply</Label>
                        <textarea
                          {...register(`voiceSamples.${index}.userReply`)}
                          rows={3}
                          className="w-full bg-transparent border-none text-indigo-300 text-sm focus:ring-0 mt-1 resize-none italic"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendVoice({ samplePostContext: "", userReply: "" })}
                  className="w-full border-dashed border-slate-700 text-slate-400 hover:border-slate-500"
                >
                  Add Voice Sample
                </Button>
                {errors.voiceSamples && <p className="text-red-400 text-xs mt-2">{errors.voiceSamples.message}</p>}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-slate-400 hover:text-white"
              >
                Back
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-500 px-8"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 px-8"
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
