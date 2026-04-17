import { RoutineData, DeploymentType, AutomationLevel, OutputChannel } from '../../types';

interface Props {
  data: RoutineData;
  onChange: (updates: Partial<RoutineData>) => void;
}

const CADENCE_PRESETS = [
  { value: 'Every day at 8am', label: 'Daily 8am' },
  { value: 'Every weekday at 8am', label: 'Weekdays 8am' },
  { value: 'Every Monday at 9am', label: 'Weekly Mon' },
  { value: 'Every Friday at 4pm', label: 'Weekly Fri' },
  { value: 'First Monday of each month at 9am', label: 'Monthly' },
];

interface DeployOption {
  type: DeploymentType;
  icon: string;
  title: string;
  desc: string;
  tag: string;
  tagStyle: string;
}

const DEPLOY_OPTIONS: DeployOption[] = [
  {
    type: 'local-manual',
    icon: '💻',
    title: 'Local — On Demand',
    desc: 'A Claude Code skill you invoke yourself with /routine-name. No scheduling, full control.',
    tag: 'Manual only',
    tagStyle: 'bg-gray-100 text-gray-600',
  },
  {
    type: 'local-scheduled',
    icon: '⏰',
    title: 'Local — Scheduled',
    desc: 'Claude Code skill + a scheduled task on your machine. Runs automatically on your chosen cadence.',
    tag: 'Recommended',
    tagStyle: 'bg-indigo-100 text-indigo-700',
  },
  {
    type: 'cloud',
    icon: '☁️',
    title: 'Cloud Hosted',
    desc: 'Runs in the cloud without your machine needing to be on. Requires infra setup (AWS Lambda or GCP Cloud Functions).',
    tag: 'Check with IT',
    tagStyle: 'bg-amber-100 text-amber-700',
  },
];

interface AutoLevelOption {
  level: AutomationLevel;
  icon: string;
  title: string;
  desc: string;
}

const AUTO_LEVELS: AutoLevelOption[] = [
  {
    level: 'full',
    icon: '🤖',
    title: 'Fully automated',
    desc: 'Runs silently and delivers output. Set it and forget it.',
  },
  {
    level: 'semi',
    icon: '👀',
    title: 'Human in loop',
    desc: 'Shows you a preview and waits for approval before delivering.',
  },
  {
    level: 'notify',
    icon: '🔔',
    title: 'Notify only',
    desc: 'Surfaces the findings. You decide what action to take.',
  },
];

interface OutputOption {
  channel: OutputChannel;
  icon: string;
  label: string;
  placeholder: string;
}

const OUTPUT_OPTIONS: OutputOption[] = [
  { channel: 'slack', icon: '💬', label: 'Slack', placeholder: '#channel-name or @username' },
  { channel: 'email', icon: '📧', label: 'Email', placeholder: 'recipient@company.com' },
  { channel: 'doc', icon: '📄', label: 'Document', placeholder: 'Google Doc, Notion page, etc.' },
  { channel: 'console', icon: '🖥️', label: 'Console', placeholder: '' },
];

export default function Step4Options({ data, onChange }: Props) {
  const selectedCadenceIsPreset =
    data.cadencePreset && !data.cadenceCustom;

  return (
    <div className="space-y-5">

      {/* Section: Where does it run */}
      <Section title="Where does it run?" subtitle="Choose how your routine gets executed.">
        <div className="space-y-3">
          {DEPLOY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.type}
              selected={data.deploymentType === opt.type}
              onClick={() => onChange({ deploymentType: opt.type })}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{opt.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${opt.tagStyle}`}>
                    {opt.tag}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
              </div>
              <Radio selected={data.deploymentType === opt.type} />
            </OptionCard>
          ))}
        </div>

        {/* Cloud note */}
        {data.deploymentType === 'cloud' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong>Cloud infra note:</strong> Cloud-hosted automation requires approved
              infrastructure. Only AWS (Lambda + EventBridge) and GCP (Cloud Functions +
              Cloud Scheduler) are approved platforms. Check with your IT team before
              proceeding.
            </p>
          </div>
        )}
      </Section>

      {/* Section: Cadence (hidden for manual) */}
      {data.deploymentType !== 'local-manual' && (
        <Section title="How often should it run?" subtitle="Pick a preset or describe your own schedule.">
          <div className="flex flex-wrap gap-2 mb-3">
            {CADENCE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onChange({ cadencePreset: p.value, cadenceCustom: '' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                  selectedCadenceIsPreset && data.cadencePreset === p.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={data.cadenceCustom}
            onChange={(e) =>
              onChange({ cadenceCustom: e.target.value, cadencePreset: '' })
            }
            placeholder='Custom: e.g. "Every Tuesday and Thursday at 7:30am" or a cron expression'
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </Section>
      )}

      {/* Section: Level of automation */}
      <Section
        title="Level of automation"
        subtitle="How much control do you want to keep?"
      >
        <div className="grid grid-cols-3 gap-3">
          {AUTO_LEVELS.map((opt) => (
            <button
              key={opt.level}
              onClick={() => onChange({ automationLevel: opt.level })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                data.automationLevel === opt.level
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{opt.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Section: Output destination */}
      <Section title="Where does the output go?" subtitle="Where should the routine deliver its results?">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {OUTPUT_OPTIONS.map((opt) => (
            <button
              key={opt.channel}
              onClick={() => onChange({ outputChannel: opt.channel, outputDetails: '' })}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                data.outputChannel === opt.channel
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
            </button>
          ))}
        </div>

        {data.outputChannel !== 'console' && (
          <input
            type="text"
            value={data.outputDetails}
            onChange={(e) => onChange({ outputDetails: e.target.value })}
            placeholder={
              OUTPUT_OPTIONS.find((o) => o.channel === data.outputChannel)?.placeholder ?? ''
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h3>
      <p className="text-gray-400 text-xs mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-indigo-500' : 'border-gray-300'
      }`}
    >
      {selected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
    </div>
  );
}
