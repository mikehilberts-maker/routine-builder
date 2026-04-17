export interface KnownSkill {
  name: string;
  description: string;
  source: 'local' | 'amplitude';
  url: string;
}

export interface SkillMatch {
  skill: KnownSkill;
  matchedTerms: string[];
}

// Mike's installed local skills
export const LOCAL_SKILLS: KnownSkill[] = [
  {
    name: 'create-routine',
    description:
      'Creates a new recurring routine as a Claude Code skill and optional scheduled task. Build automation recurring workflow daily weekly cadence schedule trigger.',
    source: 'local',
    url: '',
  },
  {
    name: 'forecast-note-reminder',
    description:
      'Checks EMEA SE forecast notes freshness ahead of Thursday forecast call. Runs every Tuesday. For each SE with qualifying opportunity reads SE Manager Forecast Notes. Salesforce forecast reminder weekly.',
    source: 'local',
    url: '',
  },
  {
    name: 'forecast-notes',
    description:
      'Prompt team leads for forecast update or update SE Manager Notes. Salesforce forecast weekly nudge.',
    source: 'local',
    url: '',
  },
  {
    name: 'forecast-prompt',
    description:
      'Prompt team leads for forecast update or update SE Manager Notes. Salesforce forecast weekly.',
    source: 'local',
    url: '',
  },
  {
    name: 'prep-call',
    description:
      'Generates a structured pre-call brief for Amplitude Solution Engineers before customer or prospect meeting. Prepare for call meeting demo discovery Salesforce calendar accounts.',
    source: 'local',
    url: '',
  },
  {
    name: 'routine-builder',
    description:
      'Launches the Routine Builder interactive wizard that guides the user through designing automation worth building. Build routine create automation wizard.',
    source: 'local',
    url: '',
  },
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'it', 'its', 'this', 'that',
  'my', 'your', 'their', 'our', 'we', 'i', 'you', 'he', 'she', 'they',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'each',
  'every', 'all', 'any', 'some', 'no', 'not', 'so', 'if', 'then',
  'when', 'where', 'how', 'what', 'who', 'which', 'before', 'after',
  'about', 'into', 'out', 'up', 'down', 'over', 'under', 'between',
  'through', 'per', 'new', 'old', 'use', 'used', 'using', 'get', 'also',
  'want', 'need', 'make', 'just', 'more', 'than', 'them', 'these',
  'are', 'was', 'were', 'run', 'runs', 'running', 'send', 'sends',
]);

export function extractKeywords(texts: string[]): string[] {
  const combined = texts.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = combined.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  return [...new Set(words)];
}

export function findMatches(keywords: string[], skills: KnownSkill[]): SkillMatch[] {
  const results: SkillMatch[] = [];

  for (const skill of skills) {
    const skillText = `${skill.name.replace(/-/g, ' ')} ${skill.description}`.toLowerCase();
    const matched = [...new Set(keywords.filter(kw => skillText.includes(kw)))];
    if (matched.length >= 2) {
      results.push({ skill, matchedTerms: matched });
    }
  }

  return results.sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
}

function parseDescription(content: string): string {
  const lines = content.split('\n');
  let inDesc = false;
  const descLines: string[] = [];

  for (const line of lines) {
    // Inline: "description: some text here"
    const inline = line.match(/^description:\s+([^|>].+)$/);
    if (inline) {
      return inline[1].replace(/^['">]|['">]$/g, '').trim();
    }
    // Block start: "description: |" or "description: >"
    if (line.match(/^description:\s*[|>]?\s*$/)) {
      inDesc = true;
      continue;
    }
    if (inDesc) {
      if (line.startsWith('  ') || line.startsWith('\t')) {
        descLines.push(line.trim());
        if (descLines.length >= 3) break; // take first 3 lines max
      } else if (line.trim() === '' && descLines.length === 0) {
        continue;
      } else {
        break;
      }
    }
  }

  return descLines.join(' ').trim();
}

export async function fetchAmplitudeSkills(): Promise<KnownSkill[]> {
  const REPO = 'amplitude/javascript';
  const SKILLS_PATH = '.agents/skills';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${SKILLS_PATH}`,
      { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const dirs: { name: string; type: string }[] = await res.json();

    const skillPromises = dirs
      .filter(d => d.type === 'dir')
      .map(async (d): Promise<KnownSkill | null> => {
        try {
          const raw = await fetch(
            `https://raw.githubusercontent.com/${REPO}/master/${SKILLS_PATH}/${d.name}/SKILL.md`,
            { signal: controller.signal }
          );
          if (!raw.ok) return null;
          const text = await raw.text();
          return {
            name: d.name,
            description: parseDescription(text),
            source: 'amplitude',
            url: `https://github.com/${REPO}/tree/master/${SKILLS_PATH}/${d.name}`,
          };
        } catch {
          return null;
        }
      });

    const results = await Promise.all(skillPromises);
    return results.filter((s): s is KnownSkill => s !== null);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}
