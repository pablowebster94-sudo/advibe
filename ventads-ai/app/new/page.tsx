"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrandStep } from "@/components/wizard/steps/BrandStep";
import { ObjectiveStep } from "@/components/wizard/steps/ObjectiveStep";
import { PhotosStep } from "@/components/wizard/steps/PhotosStep";
import { ProductStep } from "@/components/wizard/steps/ProductStep";
import { ReviewStep } from "@/components/wizard/steps/ReviewStep";
import { StyleStep } from "@/components/wizard/steps/StyleStep";
import { Stepper } from "@/components/wizard/Stepper";
import { EMPTY_WIZARD_STATE, type WizardState } from "@/lib/wizard-types";

function canProceed(step: number, state: WizardState) {
  if (step === 0) return state.product.category.trim() !== "" && state.product.name.trim() !== "";
  if (step === 2 && state.brand.mode === "new") return state.brand.name.trim() !== "";
  return true;
}

export default function NewProductPage() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goTo(index: number) {
    if (index <= furthest) setStep(index);
  }

  function next() {
    const nextStep = Math.min(step + 1, 5);
    setStep(nextStep);
    setFurthest((f) => Math.max(f, nextStep));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleGenerate() {
    setSubmitting(true);
    setError(null);
    try {
      let brandId: string | null = null;

      if (state.brand.mode === "existing") {
        brandId = state.brand.existingBrandId;
      } else if (state.brand.mode === "new") {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: state.brand.name,
            logoKey: state.brand.logo?.key,
            defaultCta: state.brand.defaultCta || undefined,
            contactPhone: state.brand.contactPhone || undefined,
            contactEmail: state.brand.contactEmail || undefined,
            website: state.brand.website || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo crear la marca.");
        brandId = data.brand.id;
      }

      const images = [
        ...state.productImages.map((img) => ({ ...img, role: "PRODUCT" as const })),
        ...state.referenceImages.map((img) => ({ ...img, role: "REFERENCE" as const })),
      ];

      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: state.product.category,
          name: state.product.name,
          manufacturer: state.product.manufacturer || undefined,
          model: state.product.model || undefined,
          price: state.product.price ? Number(state.product.price) : undefined,
          currency: state.product.currency || "USD",
          priceLabel: state.product.priceLabel || undefined,
          description: state.product.description || undefined,
          features: state.product.features || undefined,
          benefits: state.product.benefits || undefined,
          offer: state.product.offer || undefined,
          cta: state.product.cta || undefined,
          targetAudience: state.product.targetAudience || undefined,
          brandId: brandId || undefined,
          images,
        }),
      });
      const productData = await productRes.json();
      if (!productRes.ok) throw new Error(productData.error ?? "No se pudo crear el producto.");

      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productData.product.id,
          objective: state.objective,
          style: state.style,
        }),
      });
      const campaignData = await campaignRes.json();
      if (!campaignRes.ok) throw new Error(campaignData.error ?? "No se pudieron generar las creatividades.");

      router.push(`/results/${campaignData.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href="/products" className="text-sm text-muted hover:text-foreground">
          Mis productos
        </Link>
      </header>

      <Stepper current={step} furthestUnlocked={furthest} onSelect={goTo} />

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8">
        {step === 0 && (
          <ProductStep
            value={state.product}
            onChange={(product) => setState((s) => ({ ...s, product }))}
          />
        )}
        {step === 1 && (
          <PhotosStep
            productImages={state.productImages}
            referenceImages={state.referenceImages}
            onProductImagesChange={(productImages) =>
              setState((s) => ({ ...s, productImages }))
            }
            onReferenceImagesChange={(referenceImages) =>
              setState((s) => ({ ...s, referenceImages }))
            }
          />
        )}
        {step === 2 && (
          <BrandStep value={state.brand} onChange={(brand) => setState((s) => ({ ...s, brand }))} />
        )}
        {step === 3 && (
          <ObjectiveStep
            value={state.objective}
            onChange={(objective) => setState((s) => ({ ...s, objective }))}
          />
        )}
        {step === 4 && (
          <StyleStep value={state.style} onChange={(style) => setState((s) => ({ ...s, style }))} />
        )}
        {step === 5 && (
          <ReviewStep
            state={state}
            onGenerate={handleGenerate}
            submitting={submitting}
            error={error}
          />
        )}
      </div>

      {step < 5 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Atrás
          </Button>
          <Button onClick={next} disabled={!canProceed(step, state)}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
