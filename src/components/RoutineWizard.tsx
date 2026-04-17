import { useState } from 'react';
import { RoutineData, StepNumber, initialRoutineData } from '../types';
import Step1Describe from './steps/Step1Describe';
import Step2Challenge from './steps/Step2Challenge';
import Step3SenseCheck from './steps/Step3SenseCheck';
import Step4Options from './steps/Step4Options';
import Step5Output from './steps/Step5Output';
import { SENSE_CHECK_CRITERIA } from '../data/senseCheck';

const STEPS: { number: StepNumber; label: string }[] = [
  { number: 1, label: 'Describe' },
  { number: 2, label: 'Challenge' },
  { number: 3, label: 'Sense Check' },
  { number: 4, label: 'Options' },
  { number: 5, label: 'Output' },
];

function canAdvanceFrom(step: StepNumber, data: RoutineData): boolean {
  switch (step) {
    case 1:
      return data.description.trim().length >= 20;
    case 2:
      return data.whatSpecific.trim().length > 0 && data.whyValue.trim().length > 0;
    case 3:
      return Object.keys(data.senseCheckAnswers).length === SENSE_CHECK_CRITERIA.length;
    case 4:
      return true;
    case 5:
      return true;
  }
}

export default function RoutineWizard() {
  const [step, setStep] = useState<StepNumber>(1);
  const [data, setData] = useState<RoutineData>(initialRoutineData);

  const update = (updates: Partial<RoutineData>) =>
    setData((prev) => ({ ...prev, ...updates }));

  const next = () => {
    if (step < 5 && canAdvanceFrom(step, data)) {
      setStep((s) => (s + 1) as StepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as StepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const reset = () => {
    setData(initialRoutineData);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canAdvance = canAdvanceFrom(step, data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Powered by create-routine
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Routine Builder
          </h1>
          <p className="text-gray-500 text-base">
            Design an automation worth building — step by step.
          </p>
        </div>

        {/* Progress stepper */}
        <StepProgress steps={STEPS} current={step} />

        {/* Step content */}
        <div className="mt-8">
          {step === 1 && <Step1Describe data={data} onChange={update} />}
          {step === 2 && <Step2Challenge data={data} onChange={update} />}
          {step === 3 && <Step3SenseCheck data={data} onChange={update} />}
          {step === 4 && <Step4Options data={data} onChange={update} />}
          {step === 5 && <Step5Output data={data} onReset={reset} />}
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Step {step} of 5
              </span>
              <button
                onClick={next}
                disabled={!canAdvance}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {step === 4 ? 'Generate routine' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepProgress({
  steps,
  current,
}: {
  steps: { number: StepNumber; label: string }[];
  current: StepNumber;
}) {
  return (
    <div className="relative flex items-start justify-between">
      {/* Connector line */}
      <div className="absolute top-4 left-0 right-0 h-px bg-gray-200 mx-8">
        <div
          className="h-full bg-indigo-400 transition-all duration-500"
          style={{
            width: `${((current - 1) / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      {steps.map((s) => {
        const done = current > s.number;
        const active = current === s.number;
        return (
          <div key={s.number} className="relative flex flex-col items-center gap-2 z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                done
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : active
                    ? 'bg-white border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100'
                    : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {done ? '✓' : s.number}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                active ? 'text-indigo-700' : done ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
