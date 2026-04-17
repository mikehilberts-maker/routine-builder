import { RoutineData } from '../types';

export function generateCreateRoutinePrompt(data: RoutineData): string {
  const cadence =
    data.deploymentType !== 'local-manual'
      ? data.cadenceCustom || data.cadencePreset || 'TBD — specify cadence'
      : 'Manual invocation only';

  const outputDesc =
    data.outputChannel === 'slack'
      ? `Slack${data.outputDetails ? ` (${data.outputDetails})` : ''}`
      : data.outputChannel === 'email'
        ? `Email${data.outputDetails ? ` (${data.outputDetails})` : ''}`
        : data.outputChannel === 'doc'
          ? `Document${data.outputDetails ? ` (${data.outputDetails})` : ''}`
          : 'Console output (print to screen)';

  const automationDesc =
    data.automationLevel === 'full'
      ? 'Fully automated — run and send output without asking for confirmation'
      : data.automationLevel === 'semi'
        ? 'Semi-automated — show a preview for human approval before sending'
        : 'Notify only — run the analysis, surface findings, and wait for a manual decision';

  const deploymentDesc =
    data.deploymentType === 'local-manual'
      ? 'Local Claude Code skill (manual invocation only — no scheduled task needed)'
      : data.deploymentType === 'local-scheduled'
        ? `Local Claude Code skill + scheduled task (cadence: ${cadence})`
        : `Cloud-hosted automation — discuss infrastructure options with your team (AWS Lambda / GCP Cloud Functions recommended)`;

  const lines: string[] = [
    `/create-routine ${data.description}`,
    '',
    '---',
    '',
    '**Additional design context:**',
    '',
  ];

  if (data.whatSpecific) {
    lines.push(`**What specifically happens:**`);
    lines.push(data.whatSpecific);
    lines.push('');
  }

  if (data.whyValue) {
    lines.push(`**Why this matters:**`);
    lines.push(data.whyValue);
    lines.push('');
  }

  if (data.whyAlternative) {
    lines.push(`**Why automate instead of doing it manually:**`);
    lines.push(data.whyAlternative);
    lines.push('');
  }

  if (data.howFrequency || data.cadencePreset || data.cadenceCustom) {
    lines.push(`**Frequency / trigger:**`);
    lines.push(data.howFrequency || cadence);
    lines.push('');
  }

  if (data.howDataSources) {
    lines.push(`**Data sources needed:**`);
    lines.push(data.howDataSources);
    lines.push('');
  }

  if (data.howSuccessLooks) {
    lines.push(`**What success looks like:**`);
    lines.push(data.howSuccessLooks);
    lines.push('');
  }

  lines.push(`**Deployment:**`);
  lines.push(deploymentDesc);
  lines.push('');

  lines.push(`**Output destination:**`);
  lines.push(outputDesc);
  lines.push('');

  lines.push(`**Automation level:**`);
  lines.push(automationDesc);

  if (data.audienceType !== 'self') {
    lines.push('');
    lines.push(`**Audience:**`);
    lines.push(
      data.audienceType === 'team' ? 'My team / direct reports' : data.audienceDetails,
    );
  }

  return lines.join('\n');
}

export function generateSkillPreview(data: RoutineData): string {
  const routineName = data.description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('-');

  const cadence =
    data.cadenceCustom || data.cadencePreset || 'manual';

  return `---
name: ${routineName}
description: >
  ${data.whyValue || data.description}
  Cadence: ${cadence}.
---

# ${data.description}

${data.whyValue || 'Routine created via Routine Builder.'}

## Step 1: Gather data
[Pull from: ${data.howDataSources || 'data sources TBD'}]

## Step 2: Process and analyze
[Apply rules to identify what needs action]
[Based on: ${data.whatSpecific || 'spec from Routine Builder'}]

## Step 3: Format output
[Prepare output for: ${data.outputChannel}${data.outputDetails ? ` — ${data.outputDetails}` : ''}]

## Step 4: Deliver
[Send / save / display results]
[Level: ${
    data.automationLevel === 'full'
      ? 'Fully automated — no confirmation needed'
      : data.automationLevel === 'semi'
        ? 'Semi-automated — show preview for approval before sending'
        : 'Notify only — surface findings and wait for decision'
  }]

## Output format
[Defined during routine creation with /create-routine]

---
**IMPORTANT: This skill is designed to run ${
    data.deploymentType === 'local-manual'
      ? 'on manual invocation'
      : `as a scheduled task (${cadence})`
  }.**
`;
}
