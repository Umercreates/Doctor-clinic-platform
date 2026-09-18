"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StepNavigation({
  onBack,
  onNext,
  canGoBack = true,
  canGoNext = true,
  nextLabel = "Continue",
  nextLoading = false,
  nextType = "button",
  formId,
  hint,
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {canGoBack ? (
          <Button type="button" variant="ghost" onClick={onBack} leftIcon={ArrowLeft}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <Button
        type={nextType}
        form={nextType === "submit" ? formId : undefined}
        size="lg"
        onClick={nextType === "button" ? onNext : undefined}
        disabled={!canGoNext}
        loading={nextLoading}
        rightIcon={ArrowRight}
        className="sm:min-w-[11rem]"
      >
        {nextLabel}
      </Button>
    </div>
  );
}
