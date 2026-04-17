export interface SenseCheckCriterion {
  id: string;
  category: string;
  question: string;
  explanation: string;
  greenLabel: string;
  redLabel: string;
  /** 1 = normal, 2 = critical (counted double in score) */
  weight: 1 | 2;
}

export const SENSE_CHECK_CRITERIA: SenseCheckCriterion[] = [
  {
    id: 'repetition',
    category: 'Fit',
    question: 'This task happens on a predictable schedule or reliable trigger',
    explanation:
      'Automation thrives on predictability. Ad-hoc, irregular tasks are harder to automate without constant breakage.',
    greenLabel: 'Predictable cadence',
    redLabel: 'Too ad-hoc to automate reliably',
    weight: 2,
  },
  {
    id: 'consistency',
    category: 'Fit',
    question: 'The steps follow the same process every single time',
    explanation:
      "If the workflow changes depending on context you can't programmatically detect, the automation becomes brittle and unreliable.",
    greenLabel: 'Consistent process',
    redLabel: 'Too variable — steps change each time',
    weight: 2,
  },
  {
    id: 'data_access',
    category: 'Feasibility',
    question: 'All the data it needs is accessible via APIs, files, or databases',
    explanation:
      'Automation can only work with data it can reach. Locked-in spreadsheets, manual lookups, or proprietary UIs are blockers.',
    greenLabel: 'Data is programmatically accessible',
    redLabel: "Data isn't reachable without manual steps",
    weight: 2,
  },
  {
    id: 'safe_to_fail',
    category: 'Risk',
    question: 'An error in the automation can be caught and corrected before causing real harm',
    explanation:
      'High-stakes tasks — financial transactions, irreversible customer-facing actions — need extra safeguards or human review before automation makes sense.',
    greenLabel: 'Low blast radius if something goes wrong',
    redLabel: 'Errors could cause serious harm',
    weight: 1,
  },
  {
    id: 'rule_based',
    category: 'Fit',
    question: 'The task follows clear logical rules, not subjective or political judgment calls',
    explanation:
      'AI handles ambiguity but tasks requiring emotional intelligence, stakeholder politics, or true creative judgment are best kept human — or at least human-approved.',
    greenLabel: 'Clear rule-based logic',
    redLabel: 'Requires subjective human judgment',
    weight: 2,
  },
  {
    id: 'stable_process',
    category: 'Maintenance',
    question: 'This process is unlikely to change significantly in the next 3 months',
    explanation:
      "Automating a moving target creates maintenance debt. If the process is still being designed or debated, wait until it stabilizes before building automation around it.",
    greenLabel: 'Process is stable',
    redLabel: 'Process is still evolving',
    weight: 1,
  },
  {
    id: 'roi',
    category: 'Value',
    question: 'Automating this would save meaningful time relative to the cost to build and maintain it',
    explanation:
      'A task that takes 5 minutes once a month may not justify a week of engineering. Consider: frequency × time saved vs. build + maintenance cost.',
    greenLabel: 'Positive ROI — worth the build',
    redLabel: 'Low ROI — not worth the engineering cost',
    weight: 2,
  },
  {
    id: 'toil',
    category: 'Value',
    question: 'It currently involves tedious manual steps like copy-pasting, form entry, or repetitive clicking',
    explanation:
      '"Toil" is the gold standard indicator for automation candidates. If it feels like a chore you dread, it\'s a strong candidate.',
    greenLabel: 'Eliminates real toil',
    redLabel: "Not much toil to remove — it's mostly judgment",
    weight: 1,
  },
];

export interface SenseCheckResult {
  score: number;
  maxScore: number;
  percentage: number;
  recommendation: 'strong' | 'semi' | 'caution' | 'not-ready';
  verdict: string;
  detail: string;
  flaggedIds: string[];
}

export function calculateSenseCheckScore(
  answers: Record<string, boolean>,
): SenseCheckResult {
  let score = 0;
  let maxScore = 0;
  const flaggedIds: string[] = [];

  for (const criterion of SENSE_CHECK_CRITERIA) {
    maxScore += criterion.weight;
    if (answers[criterion.id] === true) {
      score += criterion.weight;
    } else if (answers[criterion.id] === false) {
      flaggedIds.push(criterion.id);
    }
  }

  const percentage = maxScore > 0 ? score / maxScore : 0;

  if (percentage >= 0.8) {
    return {
      score,
      maxScore,
      percentage,
      recommendation: 'strong',
      verdict: 'Strong automation candidate',
      detail:
        'The criteria align well. This is a great candidate for full automation — the time to build is clearly justified by the value delivered.',
      flaggedIds,
    };
  } else if (percentage >= 0.6) {
    return {
      score,
      maxScore,
      percentage,
      recommendation: 'semi',
      verdict: 'Semi-automation recommended',
      detail:
        "Automate the heavy lifting, but keep a human in the loop for review or approval before high-stakes actions. Check the flagged criteria — they're worth addressing.",
      flaggedIds,
    };
  } else if (percentage >= 0.4) {
    return {
      score,
      maxScore,
      percentage,
      recommendation: 'caution',
      verdict: 'Proceed with caution',
      detail:
        'Consider automating only the most repetitive slice of this workflow. Address the flagged concerns before going further — especially around data access and rule consistency.',
      flaggedIds,
    };
  } else {
    return {
      score,
      maxScore,
      percentage,
      recommendation: 'not-ready',
      verdict: 'Not ready to automate',
      detail:
        "Several key criteria aren't met. Revisit the process design, data access, or ROI. Building automation now risks fragile output and maintenance overhead that outweighs the benefit.",
      flaggedIds,
    };
  }
}
