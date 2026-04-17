import { useEffect, useState } from 'react';
import { RoutineData } from '../../types';
import {
  KnownSkill,
  SkillMatch,
  extractKeywords,
  findMatches,
  fetchAmplitudeSkills,
  LOCAL_SKILLS,
} from '../../lib/skillsCheck';

interface Props {
  data: RoutineData;
}

type Status = 'loading' | 'done' | 'error';

export default function Step3DuplicateCheck({ data }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [matches, setMatches] = useState<SkillMatch[]>([]);
  const [skillCount, setSkillCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setStatus('loading');
      setMatches([]);

      const keywords = extractKeywords([
        data.description,
        data.whatSpecific,
        data.howDataSources,
        data.whyValue,
      ]);

      try {
        const amplitudeSkills = await fetchAmplitudeSkills();
        if (cancelled) return;

        const allSkills = [...LOCAL_SKILLS, ...amplitudeSkills];
        setSkillCount(allSkills.length);
        setMatches(findMatches(keywords, allSkills));
        setStatus('done');
      } catch {
        if (!cancelled) {
          // Fall back to local-only check
          const localMatches = findMatches(keywords, LOCAL_SKILLS);
          setSkillCount(LOCAL_SKILLS.length);
          setMatches(localMatches);
          setStatus('error');
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Skills Library Check</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Before building something new, let's check if it already exists — in your local
          skills or the{' '}
          <a
            href="https://github.com/amplitude/javascript/tree/master/.agents/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            Amplitude skills library
          </a>
          .
        </p>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Checking skills libraries…</p>
          <p className="text-xs text-gray-400">Scanning amplitude/javascript + your local skills</p>
        </div>
      )}

      {/* GitHub unreachable warning (local-only results shown) */}
      {status === 'error' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-amber-900 font-semibold text-sm">Couldn't reach GitHub</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Showing local skills only. Results below may be incomplete.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {(status === 'done' || status === 'error') && (
        <>
          {matches.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3 items-start">
              <span className="text-2xl shrink-0">✅</span>
              <div>
                <p className="text-emerald-900 font-semibold text-sm">No duplicate found</p>
                <p className="text-emerald-700 text-sm mt-0.5">
                  Checked {skillCount} skills across your local library
                  {status === 'done' ? ' and the Amplitude repo' : ''}. This looks like a
                  new automation — you're clear to build.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-amber-900 font-semibold text-sm mb-1">
                  {matches.length} similar skill{matches.length > 1 ? 's' : ''} found
                </p>
                <p className="text-amber-700 text-sm">
                  Review these before building — extending an existing skill is usually faster
                  than starting from scratch.
                </p>
              </div>

              {matches.map(match => (
                <SkillCard key={`${match.skill.source}-${match.skill.name}`} match={match} />
              ))}

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-gray-600 text-sm">
                  <strong>Still want to build it?</strong> That's fine — hit Continue and
                  we'll run the full sense check to confirm it's worth the effort.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SkillCard({ match }: { match: SkillMatch }) {
  const { skill, matchedTerms } = match;
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
            /{skill.name}
          </code>
          <SourceBadge source={skill.source} />
        </div>
        {skill.url && (
          <a
            href={skill.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 shrink-0 underline underline-offset-2 whitespace-nowrap"
          >
            View →
          </a>
        )}
      </div>

      {skill.description && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          {skill.description.length > 200
            ? skill.description.slice(0, 200) + '…'
            : skill.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-gray-400 font-medium mr-1">Matched:</span>
        {matchedTerms.slice(0, 8).map(term => (
          <span
            key={term}
            className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium"
          >
            {term}
          </span>
        ))}
        {matchedTerms.length > 8 && (
          <span className="text-xs text-gray-400">+{matchedTerms.length - 8} more</span>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: KnownSkill['source'] }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        source === 'local'
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-violet-100 text-violet-700'
      }`}
    >
      {source === 'local' ? 'Local skill' : 'Amplitude repo'}
    </span>
  );
}
