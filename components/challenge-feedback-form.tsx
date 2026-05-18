"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveChallengeFeedback } from "@/app/challenge-feedback/actions";
import { Button } from "@/components/ui/button";
import { buildPlanDayHref } from "@/lib/plan-day-url";

export type ChallengeFeedbackFormValues = {
  likedText: string;
  helpedGrowthText: string;
  unnecessaryOrConfusingText: string;
  tooHardOrMissingText: string;
  suggestedChangesText: string;
  generalFeedbackText: string;
};

type ChallengeFeedbackFormProps = {
  planDayId: number;
  dayNumber: number;
  planSlug: string;
  challengeFeedbackTaskId: number;
  initialValues: ChallengeFeedbackFormValues;
  initialHasSavedFeedback: boolean;
  isLocked: boolean;
};

function valuesToKey(values: ChallengeFeedbackFormValues) {
  return JSON.stringify(values);
}

export function ChallengeFeedbackForm({
  planDayId,
  dayNumber,
  planSlug,
  challengeFeedbackTaskId,
  initialValues,
  initialHasSavedFeedback,
  isLocked,
}: ChallengeFeedbackFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [lastSavedKey, setLastSavedKey] = useState(valuesToKey(initialValues));
  const [isSaved, setIsSaved] = useState(initialHasSavedFeedback);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentKey = useMemo(() => valuesToKey(values), [values]);
  const hasAnyResponse = Object.values(values).some((value) => value.trim());
  const isDirty = currentKey !== lastSavedKey;
  const isSubmitDisabled =
    isLocked || isSaving || (isSaved && !isDirty) || !hasAnyResponse;

  const updateValue = (
    key: keyof ChallengeFeedbackFormValues,
    nextValue: string
  ) => {
    setValues((current) => ({ ...current, [key]: nextValue }));
    setErrorMessage(null);

    if (isSaved) {
      setIsSaved(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled || !formRef.current) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(formRef.current);
      await saveChallengeFeedback(formData);
      const nextSavedKey = valuesToKey(values);
      setLastSavedKey(nextSavedKey);
      setIsSaved(true);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-5 space-y-5 sm:mt-6"
    >
      <input type="hidden" name="planDayId" value={planDayId} />
      <input
        type="hidden"
        name="challengeFeedbackTaskId"
        value={challengeFeedbackTaskId}
      />

      <FeedbackField
        id="likedText"
        name="likedText"
        label="What did you think of the challenge?"
        value={values.likedText}
        onChange={(value) => updateValue("likedText", value)}
        disabled={isLocked || isSaving}
      />
      <FeedbackField
        id="helpedGrowthText"
        name="helpedGrowthText"
        label="What helped you grow during the challenge?"
        value={values.helpedGrowthText}
        onChange={(value) => updateValue("helpedGrowthText", value)}
        disabled={isLocked || isSaving}
      />
      <FeedbackField
        id="unnecessaryOrConfusingText"
        name="unnecessaryOrConfusingText"
        label="What felt unnecessary or confusing?"
        value={values.unnecessaryOrConfusingText}
        onChange={(value) => updateValue("unnecessaryOrConfusingText", value)}
        disabled={isLocked || isSaving}
      />
      <FeedbackField
        id="tooHardOrMissingText"
        name="tooHardOrMissingText"
        label="What felt too hard or missing?"
        value={values.tooHardOrMissingText}
        onChange={(value) => updateValue("tooHardOrMissingText", value)}
        disabled={isLocked || isSaving}
      />
      <FeedbackField
        id="suggestedChangesText"
        name="suggestedChangesText"
        label="What would you change for the next season?"
        value={values.suggestedChangesText}
        onChange={(value) => updateValue("suggestedChangesText", value)}
        disabled={isLocked || isSaving}
      />
      <FeedbackField
        id="generalFeedbackText"
        name="generalFeedbackText"
        label="Any other feedback?"
        value={values.generalFeedbackText}
        onChange={(value) => updateValue("generalFeedbackText", value)}
        disabled={isLocked || isSaving}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitDisabled}>
          {isSaving ? "Saving..." : isSaved && !isDirty ? "Saved" : "Save Feedback"}
        </Button>

        <Button asChild variant="secondary">
          <Link href={buildPlanDayHref("/today", planSlug, dayNumber)}>
            Return to Today
          </Link>
        </Button>
      </div>

      <p aria-live="polite" className="text-sm text-monastic-2">
        {errorMessage
          ? errorMessage
          : isSaved && !isDirty
            ? "Feedback saved."
            : " "}
      </p>
    </form>
  );
}

function FeedbackField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-monastic-1">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={4}
        maxLength={5000}
        className="monastic-field min-h-28 text-sm leading-6 sm:leading-7"
      />
    </div>
  );
}
