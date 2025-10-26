export interface TemplateConfig {
  name: string;
  description: string;
  entryPoint: string;
  features: string[];
}

export type TemplateKey = 'basic' | 'auth' | 'full' | 'summary' | 'assist' | 'figma';

export interface AppConfig {
  selectedTemplate: TemplateKey;
  availableTemplates: Record<TemplateKey, TemplateConfig>;
}