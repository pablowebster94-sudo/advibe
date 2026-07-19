export type LogoItem = {
  name: string;
  label: string;
};

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

export type WorkflowItem = {
  title: string;
  description: string;
  step: string;
};

export type PortfolioItem = {
  title: string;
  category: string;
  highlight: string;
};

export type CaseStudyItem = {
  title: string;
  metric: string;
  result: string;
  description: string;
};

export type ClientGroupItem = {
  sector: string;
  clients: string[];
};

export type CaseStudyGroupItem = {
  sector: string;
  title: string;
  metric: string;
  result: string;
  description: string;
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
