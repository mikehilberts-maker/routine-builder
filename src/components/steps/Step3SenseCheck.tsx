import { RoutineData } from '../../types';
import {
  SENSE_CHECK_CRITERIA,
  calculateSenseCheckScore,
} from '../../data/senseCheck';

interface Props {
  data: RoutineData;
  onChange: (updates: Partial<RoutineData>) => void;
}

const VERDICT_STYLES = {
  strong: {
    wrapper: 'bg-emerald-50 border-emerald-300',
    heading: 'text-emerald-900',
    body: 'text-emerald-700',
    icon: '✅',
    bar: 'bg-emerald-500',
  },
  semi: {
    wrapper: 'bg-blue-50 border-blue-300',
    heading: 'text-blue-900',
    body: 'text-blue-700',
    icon: '🔄',
    bar: 'bg-blue-500',
  },
  caution: {
    wrapper: 'bg-amber-50 border-amber-300',
    heading: 'text-amber-900',
    body: 'text-amber-700',
    icon: '⚠️',
    bar: 'bg-amber-500',
  },
  'not-ready': {
    wrapper: 'bg-red-50 border-red-300',
    heading: 'text-red-900',
    body: 'text-red-700',
    icon: '🛑',
    bar: 'bg-red-500',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Fit: 'bg-violet-100 text-violet-700',
  Feasibility: 'bg-blue-100 text-blue-700',
  Risk: 'bg-red-100 text-red-600',
  Maintenance: 'bg-amber-100 text-amber-700',
  Value: 'bg-emerald-100 text-emerald-700',
};

export default function Step3SenseCheck({ data, onChange }: Props) {
  const answers = data.senseCheckAnswers;
  const answeredCount = Object.keys(answers).length;
  const totalCount = SENSE_CHECK_CRITERIA.length;
  const allAnswered = answeredCount === totalCount;

  const result = allAnswered ? calculateSenseCheckScore(answers) : null;
  const styles = result ? VERDICT_STYLES[result.recommendation] : null;

  const handleAnswer = (id: string, value: boolean) => {
    const next = { ...answers };
    // Toggle off if same answer tapped again
    if (next[id] === value) {
      delete next[id];
    } else {
      next[id] = value;
    }
    onChange({ senseCheckAnswers: next });
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Automation Sense Check</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">
          Based on industry best practices for automation ROI and AI reliability.
          Answer honestly — this is diagnostic, not a gate.
        </p>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 shrink-0 tabular-nums">
            {answeredCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Criteria cards */}
      {SENSE_CHECK_CRITERIA.map((criterion) => {
        const answer = answers[criterion.id];
        const answered = answer !== undefined;
        const isYes = answer === true;
        const isNo = answer === false;

        return (
          <div
            key={criterion.id}
            className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 ${
              answered
                ? isYes
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-red-200 bg-red-50/20'
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      CATEGORY_COLORS[criterion.category] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {criterion.category}
                  </span>
                  {criterion.weight === 2 && (
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">
                      High weight
                    </span>
                  )}
                </div>
                <p className="text-gray-800 font-medium text-sm leading-snug">
                  {criterion.question}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {criterion.explanation}
                </p>
              </div>

              {/* Yes / No buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleAnswer(criterion.id, true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                    isYes
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer(criterion.id, false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                    isNo
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Inline label */}
            {answered && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p
                  className={`text-xs font-semibold ${
                    isYes ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {isYes ? `✓ ${criterion.greenLabel}` : `⚠ ${criterion.redLabel}`}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Verdict */}
      {allAnswered && result && styles && (
        <div className={`rounded-2xl border-2 p-6 ${styles.wrapper}`}>
          <div className="flex items-start gap-4 mb-3">
            <span className="text-3xl">{styles.icon}</span>
            <div className="flex-1">
              <p className={`font-bold text-lg leading-tight ${styles.heading}`}>
                {result.verdict}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${styles.bar} transition-all duration-500`}
                    style={{ width: `${result.percentage * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-bold tabular-nums ${styles.heading}`}>
                  {result.score}/{result.maxScore}
                </span>
              </div>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${styles.body}`}>{result.detail}</p>

          {result.flaggedIds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-current/10">
              <p className={`text-xs font-semibold mb-2 ${styles.heading}`}>
                Flagged criteria to address:
              </p>
              <ul className="space-y-1">
                {result.flaggedIds.map((id) => {
                  const criterion = SENSE_CHECK_CRITERIA.find((c) => c.id === id);
                  return criterion ? (
                    <li key={id} className={`text-xs ${styles.body}`}>
                      • {criterion.question}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {!allAnswered && (
        <p className="text-center text-xs text-gray-400 py-1">
          Answer all {totalCount} questions to see your automation verdict.
        </p>
      )}
    </div>
  );
}
