import type { UploadedImage } from "@/components/wizard/ImageUploader";

export type ProductFormState = {
  category: string;
  name: string;
  manufacturer: string;
  model: string;
  price: string;
  currency: string;
  priceLabel: string;
  description: string;
  features: string;
  benefits: string;
  offer: string;
  cta: string;
  targetAudience: string;
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  category: "",
  name: "",
  manufacturer: "",
  model: "",
  price: "",
  currency: "USD",
  priceLabel: "",
  description: "",
  features: "",
  benefits: "",
  offer: "",
  cta: "",
  targetAudience: "",
};

export type BrandFormState = {
  mode: "none" | "existing" | "new";
  existingBrandId: string | null;
  name: string;
  logo: UploadedImage | null;
  colors: string[];
  defaultCta: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
};

export const EMPTY_BRAND_FORM: BrandFormState = {
  mode: "none",
  existingBrandId: null,
  name: "",
  logo: null,
  colors: [],
  defaultCta: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
};

export type WizardState = {
  product: ProductFormState;
  productImages: UploadedImage[];
  referenceImages: UploadedImage[];
  brand: BrandFormState;
  objective: string;
  style: string;
};

export const EMPTY_WIZARD_STATE: WizardState = {
  product: EMPTY_PRODUCT_FORM,
  productImages: [],
  referenceImages: [],
  brand: EMPTY_BRAND_FORM,
  objective: "VENDER",
  style: "COMERCIAL",
};
