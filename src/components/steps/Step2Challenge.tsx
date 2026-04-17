import { RoutineData } from '../../types';

interface ChallengeField {
  key: keyof Pick<
    RoutineData,
    'whatSpecific' | 'whyValue' | 'whyAlternative' | 'howFrequency' | 'howDataSources' | 'howSuccessLooks'
  >;
  tag: string;
  tagColor: string;
  label: string;
  challenge: string;
  placeholder: string;
  required: boolean;
  rows: number;
}

const FIELDS: ChallengeField[] = [
  {
    key: 'whatSpecific',
    tag: 'WHAT',
    tagColor: 'bg-violet-100 text-violet-700',
    label: 'What specifically happens, step by step?',
    challenge:
      "Be precise. Vague automations fail. What exact actions occur, in what order? Name the tools, the data, the decision points.",
    placeholder:
      'e.g. 1) Query Salesforce for all Stage 3+ opps with zero activity in 14 days\n2) Group results by account owner\n3) For each owner, send a Slack DM listing their stalled deals with deal name, stage, and last activity date',
    required: true,
    rows: 4,
  },
  {
    key: 'whyValue',
    tag: 'WHY',
    tagColor: 'bg-amber-100 text-amber-700',
    label: 'Why does this matter — what breaks without it?',
    challenge:
      "If you can't clearly articulate the value, neither can your automation. What's the real cost of this task not happening?",
    placeholder:
      'e.g. Stalled deals go unnoticed until forecast calls. We\'ve lost 3 recoverable deals this quarter because no one noticed until it was too late.',
    required: true,
    rows: 3,
  },
  {
    key: 'whyAlternative',
    tag: 'WHY AUTOMATE',
    tagColor: 'bg-blue-100 text-blue-700',
    label: "Why not just do it manually?",
    challenge:
      "Force yourself to justify automation. If it's simple and infrequent, manual might be smarter. What makes this genuinely worth building?",
    placeholder:
      'e.g. Takes 30 min every Monday and gets skipped when things get busy. Missed it 3 Mondays this quarter already.',
    required: false,
    rows: 2,
  },
  {
    key: 'howDataSources',
    tag: 'HOW — DATA',
    tagColor: 'bg-green-100 text-green-700',
    label: 'What data sources does it need access to?',
    challenge:
      "Name every data source. If a source isn't accessible via API or file, the automation may not be feasible.",
    placeholder:
      'e.g. Salesforce (deal data, activity logs), Slack (sending DMs to reps), Google Calendar (checking if there\'s a forecast call this week)',
    required: false,
    rows: 2,
  },
  {
    key: 'howFrequency',
    tag: 'HOW — CADENCE',
    tagColor: 'bg-green-100 text-green-700',
    label: 'How often should this run, and what triggers it?',
    challenge:
      "Time-based? Event-based? On demand? Getting this wrong creates wasted runs or missed windows.",
    placeholder:
      'e.g. Every Monday at 9am. Or: triggered whenever a deal goes 7 days without activity.',
    required: false,
    rows: 2,
  },
  {
    key: 'howSuccessLooks',
    tag: 'DONE WHEN',
    tagColor: 'bg-rose-100 text-rose-700',
    label: 'What does a successful run look like?',
    challenge:
      "How will you know it worked? Define the measurable, observable output — not the intent.",
    placeholder:
      'e.g. Each rep with ≥1 stalled deal received a Slack DM. A summary was posted to #se-managers. The whole thing took < 2 minutes.',
    required: false,
    rows: 2,
  },
];

interface Props {
  data: RoutineData;
  onChange: (updates: Partial<RoutineData>) => void;
}

export default function Step2Challenge({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <span className="text-xl mt-0.5">⚡</span>
        <div>
          <p className="text-amber-900 font-semibold text-sm">The Design Challenge</p>
          <p className="text-amber-700 text-sm mt-0.5 leading-relaxed">
            These questions are intentionally hard. The best automations have sharp answers to
            all of them. If you struggle to answer one, that's useful signal — don't skip it,
            sit with it.
          </p>
        </div>
      </div>

      {FIELDS.map((field) => {
        const value = data[field.key] as string;
        const filled = value.trim().length > 0;

        return (
          <div
            key={field.key}
            className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
              filled ? 'border-gray-200' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md tracking-wide shrink-0 mt-0.5 ${field.tagColor}`}
              >
                {field.tag}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5 italic leading-relaxed">
                  {field.challenge}
                </p>
              </div>
            </div>

            <textarea
              value={value}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
              rows={field.rows}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>
        );
      })}

      <p className="text-center text-xs text-gray-400 py-2">
        * Required fields. Optional fields make your generated routine more precise.
      </p>
    </div>
  );
}
