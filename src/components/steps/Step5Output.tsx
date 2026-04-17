import { useState } from 'react';
import { RoutineData } from '../../types';
import { generateCreateRoutinePrompt, generateSkillPreview } from '../../lib/generatePrompt';
import { calculateSenseCheckScore } from '../../data/senseCheck';

interface Props {
  data: RoutineData;
  onReset: () => void;
}

type Tab = 'prompt' | 'preview';

const DEPLOYMENT_LABELS: Record<string, string> = {
  'local-manual': 'Local — On Demand',
  'local-scheduled': 'Local — Scheduled',
  cloud: 'Cloud Hosted',
};

const AUTOMATION_LABELS: Record<string, string> = {
  full: 'Fully automated',
  semi: 'Human in loop',
  notify: 'Notify only',
};

const OUTPUT_LABELS: Record<string, string> = {
  slack: '💬 Slack',
  email: '📧 Email',
  doc: '📄 Document',
  console: '🖥️ Console',
};

const VERDICT_BADGE: Record<string, string> = {
  strong: 'bg-emerald-100 text-emerald-700',
  semi: 'bg-blue-100 text-blue-700',
  caution: 'bg-amber-100 text-amber-700',
  'not-ready': 'bg-red-100 text-red-600',
};

export default function Step5Output({ data, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('prompt');
  const [copied, setCopied] = useState(false);

  const prompt = generateCreateRoutinePrompt(data);
  const preview = generateSkillPreview(data);
  const result = calculateSenseCheckScore(data.senseCheckAnswers);
  const content = tab === 'prompt' ? prompt : preview;

  const cadence = data.cadenceCustom || data.cadencePreset;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white shadow-lg shadow-indigo-200">
        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-2">
          Routine ready
        </p>
        <h2 className="text-xl font-bold leading-snug mb-1">{data.description}</h2>
        {data.whyValue && (
          <p className="text-indigo-200 text-sm leading-relaxed">{data.whyValue}</p>
        )}

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{DEPLOYMENT_LABELS[data.deploymentType]}</Chip>
          <Chip>{AUTOMATION_LABELS[data.automationLevel]}</Chip>
          <Chip>{OUTPUT_LABELS[data.outputChannel]}</Chip>
          {cadence && <Chip>{cadence}</Chip>}
        </div>

        {/* Sense check score */}
        <div className="mt-5 pt-4 border-t border-indigo-500/40">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-indigo-900/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-700"
                style={{ width: `${result.percentage * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white tabular-nums shrink-0">
              {result.score}/{result.maxScore}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                VERDICT_BADGE[result.recommendation]
              }`}
            >
              {result.verdict}
            </span>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-amber-900 font-semibold text-sm mb-2">How to use this</p>
        <ol className="space-y-1.5 text-amber-800 text-sm">
          <li className="flex gap-2">
            <span className="font-bold shrink-0">1.</span>
            Copy the <strong>Claude Code Prompt</strong> below
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">2.</span>
            Open a terminal and run{' '}
            <code className="bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded text-xs font-mono">
              claude
            </code>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">3.</span>
            Paste the prompt and press <kbd className="bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded text-xs">Enter</kbd>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">4.</span>
            Claude Code will design and create your{' '}
            <code className="bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded text-xs font-mono">
              /create-routine
            </code>{' '}
            skill
          </li>
        </ol>
      </div>

      {/* Code output */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <TabButton active={tab === 'prompt'} onClick={() => setTab('prompt')}>
            Claude Code Prompt
          </TabButton>
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            Skill Preview
          </TabButton>
        </div>

        {/* Code block */}
        <div className="p-4">
          <pre className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-700 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
            {content}
          </pre>
        </div>

        {/* Copy button */}
        <div className="px-4 pb-4">
          <button
            onClick={copy}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {copied ? '✓ Copied to clipboard' : `Copy ${tab === 'prompt' ? 'Claude Code prompt' : 'skill preview'}`}
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="text-center pt-2 pb-8">
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Start over — build another routine
        </button>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-indigo-500/30 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full">
      {children}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-semibold transition-colors ${
        active
          ? 'text-indigo-700 bg-indigo-50 border-b-2 border-indigo-500'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
