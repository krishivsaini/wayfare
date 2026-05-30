"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CreateTripInput } from "@/lib/types";
import { GeneratingScreen, NewTripForm } from "@/components/new-trip";

export default function NewTripPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState<CreateTripInput | null>(null);
  const [seedError, setSeedError] = useState("");

  async function handleGenerate(input: CreateTripInput) {
    setGenerating(input);
    setSeedError("");
    try {
      const trip = await api.createTrip(input);
      router.replace(`/trips/${trip.id}`);
    } catch (e) {
      setGenerating(null);
      setSeedError(e instanceof Error ? e.message : "Failed to generate trip.");
    }
  }

  if (generating) return <GeneratingScreen input={generating} />;
  return <NewTripForm onGenerate={handleGenerate} onCancel={() => router.push("/dashboard")} seedError={seedError} />;
}
