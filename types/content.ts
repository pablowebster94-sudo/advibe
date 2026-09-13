export type ServiceItem = {
  title: string;
  description: string;
  icon: string;
  accent: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type ClientGroupItem = {
  sector: string;
  clients: string[];
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};
