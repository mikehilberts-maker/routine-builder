import { RoutineData } from '../../types';

const EXAMPLES = [
  {
    label: 'Pipeline review',
    text: 'Every Monday, check my team\'s Salesforce pipeline for deals stalled >14 days and send each rep a personalized Slack nudge',
  },
  {
    label: 'Standup prep',
    text: 'Every weekday morning, pull my calendar for the day and summarize yesterday\'s activity from Salesforce into a quick standup brief',
  },
  {
    label: 'Customer health',
    text: 'Monthly, pull Amplitude usage data for our top 20 accounts, flag anyone trending down, and email a health summary to CSMs',
  },
  {
    label: 'Meeting follow-up',
    text: 'After external calls, extract action items from the Granola transcript and create follow-up tasks in Salesforce',
  },
];

interface Props {
  data: RoutineData;
  onChange: (updates: Partial<RoutineData>) => void;
}

export default function Step1Describe({ data, onChange }: Props) {
  const charCount = data.description.trim().length;
  const isReady = charCount >= 20;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          What do you want to automate?
        </h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Describe the routine in plain language. Don't worry about being technical —
          we'll sharpen the details in the next steps.
        </p>

        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. Every Monday morning, check my pipeline for deals that haven't had activity in 2+ weeks and send each rep a quick Slack nudge with their stalled deals listed..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
        />

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs transition-colors ${
              isReady ? 'text-green-600 font-medium' : 'text-gray-400'
            }`}
          >
            {isReady ? '✓ Good to go' : `${20 - charCount} more characters to continue`}
          </span>
          <span className="text-xs text-gray-400">{charCount} chars</span>
        </div>
      </div>

      {/* Quick start examples */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Or pick a quick-start example
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => onChange({ description: ex.text })}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                data.description === ex.text
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                  : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600 hover:text-indigo-800'
              }`}
            >
              <span className="font-medium block mb-0.5">{ex.label}</span>
              <span className="text-xs opacity-75 leading-relaxed">{ex.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
