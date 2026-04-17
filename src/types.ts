export type StepNumber = 1 | 2 | 3 | 4 | 5;

export type DeploymentType = 'local-manual' | 'local-scheduled' | 'cloud';
export type AutomationLevel = 'full' | 'semi' | 'notify';
export type OutputChannel = 'slack' | 'email' | 'doc' | 'console';

export interface RoutineData {
  // Step 1 — Describe
  description: string;

  // Step 2 — What / Why / How challenge
  whatSpecific: string;
  whyValue: string;
  whyAlternative: string;
  howFrequency: string;
  howDataSources: string;
  howSuccessLooks: string;

  // Step 3 — Sense check (keyed by criterion id → boolean answer)
  senseCheckAnswers: Record<string, boolean>;

  // Step 4 — Deployment options
  deploymentType: DeploymentType;
  cadencePreset: string;
  cadenceCustom: string;
  outputChannel: OutputChannel;
  outputDetails: string;
  automationLevel: AutomationLevel;
  audienceType: 'self' | 'team' | 'specific';
  audienceDetails: string;
}

export const initialRoutineData: RoutineData = {
  description: '',
  whatSpecific: '',
  whyValue: '',
  whyAlternative: '',
  howFrequency: '',
  howDataSources: '',
  howSuccessLooks: '',
  senseCheckAnswers: {},
  deploymentType: 'local-scheduled',
  cadencePreset: '',
  cadenceCustom: '',
  outputChannel: 'console',
  outputDetails: '',
  automationLevel: 'semi',
  audienceType: 'self',
  audienceDetails: '',
};
