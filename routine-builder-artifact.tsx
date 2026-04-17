import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepNumber = 1 | 2 | 3 | 4 | 5;
type DeploymentType = "local-manual" | "local-scheduled" | "cloud";
type AutomationLevel = "full" | "semi" | "notify";
type OutputChannel = "slack" | "email" | "doc" | "console";

interface RoutineData {
  description: string;
  whatSpecific: string;
  whyValue: string;
  whyAlternative: string;
  howFrequency: string;
  howDataSources: string;
  howSuccessLooks: string;
  senseCheckAnswers: Record<string, boolean>;
  deploymentType: DeploymentType;
  cadencePreset: string;
  cadenceCustom: string;
  outputChannel: OutputChannel;
  outputDetails: string;
  automationLevel: AutomationLevel;
  audienceType: "self" | "team" | "specific";
  audienceDetails: string;
}

const INITIAL: RoutineData = {
  description: "", whatSpecific: "", whyValue: "", whyAlternative: "",
  howFrequency: "", howDataSources: "", howSuccessLooks: "",
  senseCheckAnswers: {}, deploymentType: "local-scheduled",
  cadencePreset: "", cadenceCustom: "", outputChannel: "console",
  outputDetails: "", automationLevel: "semi", audienceType: "self", audienceDetails: "",
};

// ─── Sense Check Data ─────────────────────────────────────────────────────────

const CRITERIA = [
  { id: "repetition", category: "Fit", weight: 2, question: "This task happens on a predictable schedule or reliable trigger", explanation: "Automation thrives on predictability. Ad-hoc, irregular tasks are harder to automate without constant breakage.", greenLabel: "Predictable cadence", redLabel: "Too ad-hoc to automate reliably" },
  { id: "consistency", category: "Fit", weight: 2, question: "The steps follow the same process every single time", explanation: "If the workflow changes depending on context you can't programmatically detect, the automation becomes brittle.", greenLabel: "Consistent process", redLabel: "Too variable — steps change each time" },
  { id: "data_access", category: "Feasibility", weight: 2, question: "All the data it needs is accessible via APIs, files, or databases", explanation: "Automation can only work with data it can reach. Locked-in spreadsheets, manual lookups, or proprietary UIs are blockers.", greenLabel: "Data is programmatically accessible", redLabel: "Data isn't reachable without manual steps" },
  { id: "safe_to_fail", category: "Risk", weight: 1, question: "An error in the automation can be caught and corrected before causing real harm", explanation: "High-stakes tasks need extra safeguards or human review before automation makes sense.", greenLabel: "Low blast radius if something goes wrong", redLabel: "Errors could cause serious harm" },
  { id: "rule_based", category: "Fit", weight: 2, question: "The task follows clear logical rules, not subjective or political judgment calls", explanation: "Tasks requiring emotional intelligence, stakeholder politics, or creative judgment are best kept human — or human-approved.", greenLabel: "Clear rule-based logic", redLabel: "Requires subjective human judgment" },
  { id: "stable_process", category: "Maintenance", weight: 1, question: "This process is unlikely to change significantly in the next 3 months", explanation: "Automating a moving target creates maintenance debt. Wait until the process stabilizes.", greenLabel: "Process is stable", redLabel: "Process is still evolving" },
  { id: "roi", category: "Value", weight: 2, question: "Automating this would save meaningful time relative to the cost to build and maintain it", explanation: "Consider: frequency × time saved vs. build + maintenance cost. A 5-min monthly task rarely justifies a week of work.", greenLabel: "Positive ROI — worth the build", redLabel: "Low ROI — not worth the engineering cost" },
  { id: "toil", category: "Value", weight: 1, question: "It currently involves tedious manual steps like copy-pasting, form entry, or repetitive clicking", explanation: "\"Toil\" is the gold standard indicator for automation candidates. If it feels like a chore you dread, it's a strong candidate.", greenLabel: "Eliminates real toil", redLabel: "Not much toil to remove — it's mostly judgment" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Fit: "bg-violet-100 text-violet-700",
  Feasibility: "bg-blue-100 text-blue-700",
  Risk: "bg-red-100 text-red-600",
  Maintenance: "bg-amber-100 text-amber-700",
  Value: "bg-emerald-100 text-emerald-700",
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreAnswers(answers: Record<string, boolean>) {
  let score = 0, maxScore = 0;
  const flaggedIds: string[] = [];
  for (const c of CRITERIA) {
    maxScore += c.weight;
    if (answers[c.id] === true) score += c.weight;
    else if (answers[c.id] === false) flaggedIds.push(c.id);
  }
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.8) return { score, maxScore, pct, rec: "strong" as const, verdict: "Strong automation candidate", detail: "The criteria align well. This is a great candidate for full automation — the time to build is justified by the value delivered.", flaggedIds };
  if (pct >= 0.6) return { score, maxScore, pct, rec: "semi" as const, verdict: "Semi-automation recommended", detail: "Automate the heavy lifting, but keep a human in the loop before high-stakes actions. Check the flagged criteria.", flaggedIds };
  if (pct >= 0.4) return { score, maxScore, pct, rec: "caution" as const, verdict: "Proceed with caution", detail: "Consider automating only the most repetitive slice. Address the flagged concerns first — especially around data access and rule consistency.", flaggedIds };
  return { score, maxScore, pct, rec: "not-ready" as const, verdict: "Not ready to automate", detail: "Several key criteria aren't met. Revisit the process design, data access, or ROI before building automation.", flaggedIds };
}

const VERDICT_STYLES = {
  strong: { wrapper: "bg-emerald-50 border-emerald-300", heading: "text-emerald-900", body: "text-emerald-700", icon: "✅", bar: "bg-emerald-500" },
  semi: { wrapper: "bg-blue-50 border-blue-300", heading: "text-blue-900", body: "text-blue-700", icon: "🔄", bar: "bg-blue-500" },
  caution: { wrapper: "bg-amber-50 border-amber-300", heading: "text-amber-900", body: "text-amber-700", icon: "⚠️", bar: "bg-amber-500" },
  "not-ready": { wrapper: "bg-red-50 border-red-300", heading: "text-red-900", body: "text-red-700", icon: "🛑", bar: "bg-red-500" },
};

// ─── Prompt Generator ─────────────────────────────────────────────────────────

function buildPrompt(data: RoutineData): string {
  const cadence = data.deploymentType !== "local-manual" ? (data.cadenceCustom || data.cadencePreset || "TBD") : "Manual invocation only";
  const outputDesc = { slack: `Slack${data.outputDetails ? ` (${data.outputDetails})` : ""}`, email: `Email${data.outputDetails ? ` (${data.outputDetails})` : ""}`, doc: `Document${data.outputDetails ? ` (${data.outputDetails})` : ""}`, console: "Console output" }[data.outputChannel];
  const automationDesc = { full: "Fully automated — run and send without asking", semi: "Semi-automated — show preview for approval before sending", notify: "Notify only — surface findings, wait for manual decision" }[data.automationLevel];
  const deploymentDesc = { "local-manual": "Local Claude Code skill (manual invocation only)", "local-scheduled": `Local Claude Code skill + scheduled task (${cadence})`, cloud: "Cloud-hosted — discuss infra with IT team (AWS Lambda / GCP Cloud Functions)" }[data.deploymentType];

  const lines = [`/create-routine ${data.description}`, "", "---", "", "**Additional design context:**", ""];
  if (data.whatSpecific) { lines.push("**What specifically happens:**", data.whatSpecific, ""); }
  if (data.whyValue) { lines.push("**Why this matters:**", data.whyValue, ""); }
  if (data.whyAlternative) { lines.push("**Why automate instead of manual:**", data.whyAlternative, ""); }
  if (data.howFrequency || cadence !== "Manual invocation only") { lines.push("**Frequency / trigger:**", data.howFrequency || cadence, ""); }
  if (data.howDataSources) { lines.push("**Data sources needed:**", data.howDataSources, ""); }
  if (data.howSuccessLooks) { lines.push("**What success looks like:**", data.howSuccessLooks, ""); }
  lines.push("**Deployment:**", deploymentDesc, "", "**Output:**", outputDesc, "", "**Automation level:**", automationDesc);
  return lines.join("\n");
}

// ─── Step 1 — Describe ────────────────────────────────────────────────────────

const EXAMPLES = [
  { label: "Pipeline review", text: "Every Monday, check my team's Salesforce pipeline for deals stalled >14 days and send each rep a personalized Slack nudge" },
  { label: "Standup prep", text: "Every weekday morning, pull my calendar and summarize yesterday's Salesforce activity into a quick standup brief" },
  { label: "Customer health", text: "Monthly, pull Amplitude usage data for our top 20 accounts, flag anyone trending down, and email a summary to CSMs" },
  { label: "Meeting follow-up", text: "After external calls, extract action items from the Granola transcript and create follow-up tasks in Salesforce" },
];

function Step1({ data, onChange }: { data: RoutineData; onChange: (u: Partial<RoutineData>) => void }) {
  const len = data.description.trim().length;
  const ok = len >= 20;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">What do you want to automate?</h2>
        <p className="text-gray-500 text-sm mb-4">Describe it in plain language — we'll sharpen the details next.</p>
        <textarea value={data.description} onChange={e => onChange({ description: e.target.value })} placeholder="e.g. Every Monday morning, check my pipeline for deals with no activity in 2+ weeks and send each rep a Slack nudge..." rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        <div className="mt-2 flex justify-between">
          <span className={`text-xs ${ok ? "text-green-600 font-medium" : "text-gray-400"}`}>{ok ? "✓ Good to go" : `${20 - len} more characters to continue`}</span>
          <span className="text-xs text-gray-400">{len} chars</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick-start examples</p>
        <div className="space-y-2">
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => onChange({ description: ex.text })} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${data.description === ex.text ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600"}`}>
              <span className="font-medium block">{ex.label}</span>
              <span className="text-xs opacity-75">{ex.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Challenge ───────────────────────────────────────────────────────

const CHALLENGE_FIELDS = [
  { key: "whatSpecific" as const, tag: "WHAT", color: "bg-violet-100 text-violet-700", label: "What specifically happens, step by step?", challenge: "Be precise. Vague automations fail. Name the exact actions, tools, and decision points.", placeholder: "e.g. 1) Query Salesforce for Stage 3+ opps with no activity in 14 days\n2) Group by owner\n3) Send each owner a Slack DM with their stalled deals listed", required: true, rows: 4 },
  { key: "whyValue" as const, tag: "WHY", color: "bg-amber-100 text-amber-700", label: "Why does this matter — what breaks without it?", challenge: "If you can't articulate the value clearly, neither can your automation.", placeholder: "e.g. Stalled deals go unnoticed until forecast calls. We've lost 3 recoverable deals this quarter.", required: true, rows: 3 },
  { key: "whyAlternative" as const, tag: "WHY AUTOMATE", color: "bg-blue-100 text-blue-700", label: "Why not just do it manually?", challenge: "Force yourself to justify automation. If it's rare and easy, manual might be smarter.", placeholder: "e.g. Takes 30 min every Monday and gets skipped when things get busy. Missed it 3x this quarter.", required: false, rows: 2 },
  { key: "howDataSources" as const, tag: "HOW — DATA", color: "bg-green-100 text-green-700", label: "What data sources does it need access to?", challenge: "Name every source. If it isn't accessible via API or file, the automation may not be feasible.", placeholder: "e.g. Salesforce (deals, activity logs), Slack (sending DMs), Google Calendar (forecast calls)", required: false, rows: 2 },
  { key: "howFrequency" as const, tag: "HOW — CADENCE", color: "bg-green-100 text-green-700", label: "How often and what triggers it?", challenge: "Time-based? Event-based? On demand? Getting this wrong creates wasted runs.", placeholder: "e.g. Every Monday at 9am — or triggered when a deal goes 7 days without activity.", required: false, rows: 2 },
  { key: "howSuccessLooks" as const, tag: "DONE WHEN", color: "bg-rose-100 text-rose-700", label: "What does a successful run look like?", challenge: "Define the measurable output — not the intent.", placeholder: "e.g. Each rep with stalled deals got a Slack DM. Summary posted to #se-managers. Took < 2 min.", required: false, rows: 2 },
];

function Step2({ data, onChange }: { data: RoutineData; onChange: (u: Partial<RoutineData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <span className="text-xl">⚡</span>
        <div>
          <p className="text-amber-900 font-semibold text-sm">The Design Challenge</p>
          <p className="text-amber-700 text-sm mt-0.5">These questions are intentionally hard. The best automations have sharp answers. Struggling with one is useful signal — sit with it.</p>
        </div>
      </div>
      {CHALLENGE_FIELDS.map(f => (
        <div key={f.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex gap-3 mb-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5 ${f.color}`}>{f.tag}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{f.label}{f.required && <span className="text-red-400 ml-1">*</span>}</p>
              <p className="text-gray-400 text-xs italic mt-0.5">{f.challenge}</p>
            </div>
          </div>
          <textarea value={data[f.key] as string} onChange={e => onChange({ [f.key]: e.target.value })} placeholder={f.placeholder} rows={f.rows} className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      ))}
      <p className="text-center text-xs text-gray-400">* Required. Optional fields make the generated routine more precise.</p>
    </div>
  );
}

// ─── Step 3 — Sense Check ─────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: RoutineData; onChange: (u: Partial<RoutineData>) => void }) {
  const answers = data.senseCheckAnswers;
  const answered = Object.keys(answers).length;
  const total = CRITERIA.length;
  const allDone = answered === total;
  const result = allDone ? scoreAnswers(answers) : null;
  const styles = result ? VERDICT_STYLES[result.rec] : null;

  const toggle = (id: string, val: boolean) => {
    const next = { ...answers };
    if (next[id] === val) delete next[id]; else next[id] = val;
    onChange({ senseCheckAnswers: next });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Automation Sense Check</h2>
        <p className="text-gray-500 text-sm mb-3">Based on industry best practices. Answer honestly — this is diagnostic, not a gate.</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-500 tabular-nums">{answered} / {total}</span>
        </div>
      </div>

      {CRITERIA.map(c => {
        const ans = answers[c.id];
        const isYes = ans === true, isNo = ans === false, isDone = ans !== undefined;
        return (
          <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${isDone ? isYes ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/20" : "border-gray-100"}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[c.category]}`}>{c.category}</span>
                  {c.weight === 2 && <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">High weight</span>}
                </div>
                <p className="text-gray-800 font-medium text-sm">{c.question}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{c.explanation}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => toggle(c.id, true)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${isYes ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700"}`}>Yes</button>
                <button onClick={() => toggle(c.id, false)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${isNo ? "bg-red-500 border-red-500 text-white" : "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600"}`}>No</button>
              </div>
            </div>
            {isDone && <div className="mt-2 pt-2 border-t border-gray-100"><p className={`text-xs font-semibold ${isYes ? "text-emerald-700" : "text-red-600"}`}>{isYes ? `✓ ${c.greenLabel}` : `⚠ ${c.redLabel}`}</p></div>}
          </div>
        );
      })}

      {allDone && result && styles && (
        <div className={`rounded-2xl border-2 p-5 ${styles.wrapper}`}>
          <div className="flex gap-3 mb-3">
            <span className="text-3xl">{styles.icon}</span>
            <div className="flex-1">
              <p className={`font-bold text-lg ${styles.heading}`}>{result.verdict}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${result.pct * 100}%` }} />
                </div>
                <span className={`text-xs font-bold tabular-nums ${styles.heading}`}>{result.score}/{result.maxScore}</span>
              </div>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${styles.body}`}>{result.detail}</p>
          {result.flaggedIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/10">
              <p className={`text-xs font-semibold mb-1 ${styles.heading}`}>Flagged criteria:</p>
              {result.flaggedIds.map(id => { const c = CRITERIA.find(x => x.id === id); return c ? <p key={id} className={`text-xs ${styles.body}`}>• {c.question}</p> : null; })}
            </div>
          )}
        </div>
      )}
      {!allDone && <p className="text-center text-xs text-gray-400">Answer all {total} questions to see your verdict.</p>}
    </div>
  );
}

// ─── Step 4 — Options ─────────────────────────────────────────────────────────

const DEPLOY_OPTIONS = [
  { type: "local-manual" as DeploymentType, icon: "💻", title: "Local — On Demand", desc: "A Claude Code skill you invoke yourself. No scheduling, full control.", tag: "Manual only", tagStyle: "bg-gray-100 text-gray-600" },
  { type: "local-scheduled" as DeploymentType, icon: "⏰", title: "Local — Scheduled", desc: "Claude Code skill + scheduled task on your machine. Runs automatically.", tag: "Recommended", tagStyle: "bg-indigo-100 text-indigo-700" },
  { type: "cloud" as DeploymentType, icon: "☁️", title: "Cloud Hosted", desc: "Runs in the cloud — no machine needed. Requires infra setup (AWS Lambda or GCP Cloud Functions).", tag: "Check with IT", tagStyle: "bg-amber-100 text-amber-700" },
];

const CADENCE_PRESETS = [
  { value: "Every day at 8am", label: "Daily 8am" },
  { value: "Every weekday at 8am", label: "Weekdays 8am" },
  { value: "Every Monday at 9am", label: "Weekly Mon" },
  { value: "Every Friday at 4pm", label: "Weekly Fri" },
  { value: "First Monday of each month at 9am", label: "Monthly" },
];

const AUTO_LEVELS = [
  { level: "full" as AutomationLevel, icon: "🤖", title: "Fully automated", desc: "Runs silently and delivers. Set it and forget it." },
  { level: "semi" as AutomationLevel, icon: "👀", title: "Human in loop", desc: "Shows preview, waits for approval before sending." },
  { level: "notify" as AutomationLevel, icon: "🔔", title: "Notify only", desc: "Surfaces findings. You decide what to do next." },
];

const OUTPUT_OPTIONS = [
  { channel: "slack" as OutputChannel, icon: "💬", label: "Slack", placeholder: "#channel or @username" },
  { channel: "email" as OutputChannel, icon: "📧", label: "Email", placeholder: "recipient@company.com" },
  { channel: "doc" as OutputChannel, icon: "📄", label: "Document", placeholder: "Google Doc, Notion, etc." },
  { channel: "console" as OutputChannel, icon: "🖥️", label: "Console", placeholder: "" },
];

function Step4({ data, onChange }: { data: RoutineData; onChange: (u: Partial<RoutineData>) => void }) {
  const presetActive = data.cadencePreset && !data.cadenceCustom;
  return (
    <div className="space-y-4">
      {/* Deployment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-900 text-sm mb-0.5">Where does it run?</p>
        <p className="text-gray-400 text-xs mb-3">Choose how your routine gets executed.</p>
        <div className="space-y-2">
          {DEPLOY_OPTIONS.map(opt => (
            <button key={opt.type} onClick={() => onChange({ deploymentType: opt.type })} className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border-2 transition-all ${data.deploymentType === opt.type ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-semibold text-sm text-gray-900">{opt.title}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${opt.tagStyle}`}>{opt.tag}</span></div>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${data.deploymentType === opt.type ? "border-indigo-500" : "border-gray-300"}`}>{data.deploymentType === opt.type && <div className="w-2 h-2 rounded-full bg-indigo-500" />}</div>
            </button>
          ))}
        </div>
        {data.deploymentType === "cloud" && <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-amber-800 text-xs"><strong>Cloud infra note:</strong> Only AWS (Lambda + EventBridge) and GCP (Cloud Functions + Cloud Scheduler) are approved. Check with your IT team first.</p></div>}
      </div>

      {/* Cadence */}
      {data.deploymentType !== "local-manual" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-900 text-sm mb-0.5">How often?</p>
          <p className="text-gray-400 text-xs mb-3">Pick a preset or describe your own.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {CADENCE_PRESETS.map(p => <button key={p.value} onClick={() => onChange({ cadencePreset: p.value, cadenceCustom: "" })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${presetActive && data.cadencePreset === p.value ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{p.label}</button>)}
          </div>
          <input type="text" value={data.cadenceCustom} onChange={e => onChange({ cadenceCustom: e.target.value, cadencePreset: "" })} placeholder='Custom: e.g. "Every Tuesday at 7am"' className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      )}

      {/* Automation level */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-900 text-sm mb-0.5">Level of automation</p>
        <p className="text-gray-400 text-xs mb-3">How much control do you want to keep?</p>
        <div className="grid grid-cols-3 gap-2">
          {AUTO_LEVELS.map(opt => <button key={opt.level} onClick={() => onChange({ automationLevel: opt.level })} className={`p-3 rounded-xl border-2 text-center transition-all ${data.automationLevel === opt.level ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}><div className="text-2xl mb-1">{opt.icon}</div><p className="text-xs font-semibold text-gray-800">{opt.title}</p><p className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</p></button>)}
        </div>
      </div>

      {/* Output */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-900 text-sm mb-0.5">Where does output go?</p>
        <p className="text-gray-400 text-xs mb-3">Where should the routine deliver results?</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {OUTPUT_OPTIONS.map(opt => <button key={opt.channel} onClick={() => onChange({ outputChannel: opt.channel, outputDetails: "" })} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${data.outputChannel === opt.channel ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}><span className="text-lg">{opt.icon}</span><span className="text-sm font-semibold text-gray-800">{opt.label}</span></button>)}
        </div>
        {data.outputChannel !== "console" && <input type="text" value={data.outputDetails} onChange={e => onChange({ outputDetails: e.target.value })} placeholder={OUTPUT_OPTIONS.find(o => o.channel === data.outputChannel)?.placeholder ?? ""} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />}
      </div>
    </div>
  );
}

// ─── Step 5 — Output ──────────────────────────────────────────────────────────

const DEPLOY_LABELS: Record<string, string> = { "local-manual": "Local — On Demand", "local-scheduled": "Local — Scheduled", cloud: "Cloud Hosted" };
const AUTO_LABELS: Record<string, string> = { full: "Fully automated", semi: "Human in loop", notify: "Notify only" };
const OUT_LABELS: Record<string, string> = { slack: "💬 Slack", email: "📧 Email", doc: "📄 Document", console: "🖥️ Console" };
const BADGE: Record<string, string> = { strong: "bg-emerald-100 text-emerald-700", semi: "bg-blue-100 text-blue-700", caution: "bg-amber-100 text-amber-700", "not-ready": "bg-red-100 text-red-600" };

function Step5({ data, onReset }: { data: RoutineData; onReset: () => void }) {
  const [tab, setTab] = useState<"prompt" | "preview">("prompt");
  const [copied, setCopied] = useState(false);

  const result = scoreAnswers(data.senseCheckAnswers);
  const prompt = buildPrompt(data);
  const cadence = data.cadenceCustom || data.cadencePreset;

  const routineName = data.description.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 5).join("-");
  const preview = `---\nname: ${routineName}\ndescription: >\n  ${data.whyValue || data.description}\n  Cadence: ${cadence || "manual"}.\n---\n\n# ${data.description}\n\n${data.whyValue || "Routine created via Routine Builder."}\n\n## Step 1: Gather data\n[From: ${data.howDataSources || "sources TBD"}]\n\n## Step 2: Process & analyze\n[Based on: ${data.whatSpecific || "spec above"}]\n\n## Step 3: Format output\n[For: ${data.outputChannel}${data.outputDetails ? ` — ${data.outputDetails}` : ""}]\n\n## Step 4: Deliver\n[Level: ${AUTO_LABELS[data.automationLevel]}]`;

  const content = tab === "prompt" ? prompt : preview;

  const copy = async () => {
    try { await navigator.clipboard.writeText(content); } catch { const el = document.createElement("textarea"); el.value = content; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white shadow-lg">
        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Routine ready</p>
        <h2 className="text-lg font-bold leading-snug mb-1">{data.description}</h2>
        {data.whyValue && <p className="text-indigo-200 text-sm">{data.whyValue}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {[DEPLOY_LABELS[data.deploymentType], AUTO_LABELS[data.automationLevel], OUT_LABELS[data.outputChannel], cadence].filter(Boolean).map(label => <span key={label} className="bg-indigo-500/30 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full">{label}</span>)}
        </div>
        <div className="mt-4 pt-3 border-t border-indigo-500/40">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-indigo-900/50 rounded-full h-1.5 overflow-hidden"><div className="bg-white h-full rounded-full" style={{ width: `${result.pct * 100}%` }} /></div>
            <span className="text-xs font-bold tabular-nums">{result.score}/{result.maxScore}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[result.rec]}`}>{result.verdict}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-amber-900 font-semibold text-sm mb-2">How to use this</p>
        <ol className="space-y-1 text-amber-800 text-sm">
          <li className="flex gap-2"><span className="font-bold">1.</span> Copy the <strong>Claude Code Prompt</strong> below</li>
          <li className="flex gap-2"><span className="font-bold">2.</span> Open a terminal → run <code className="bg-amber-100 px-1 rounded text-xs font-mono">claude</code></li>
          <li className="flex gap-2"><span className="font-bold">3.</span> Paste the prompt → Claude Code creates your skill</li>
        </ol>
      </div>

      {/* Code tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["prompt", "preview"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === t ? "text-indigo-700 bg-indigo-50 border-b-2 border-indigo-500" : "text-gray-400 hover:text-gray-600"}`}>{t === "prompt" ? "Claude Code Prompt" : "Skill Preview"}</button>)}
        </div>
        <div className="p-4">
          <pre className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-700 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{content}</pre>
        </div>
        <div className="px-4 pb-4">
          <button onClick={copy} className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>{copied ? "✓ Copied!" : `Copy ${tab === "prompt" ? "Claude Code prompt" : "skill preview"}`}</button>
        </div>
      </div>

      <div className="text-center pb-4">
        <button onClick={onReset} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">Start over — build another routine</button>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1 as StepNumber, label: "Describe" },
  { n: 2 as StepNumber, label: "Challenge" },
  { n: 3 as StepNumber, label: "Sense Check" },
  { n: 4 as StepNumber, label: "Options" },
  { n: 5 as StepNumber, label: "Output" },
];

function Progress({ current }: { current: StepNumber }) {
  return (
    <div className="relative flex items-start justify-between mb-8">
      <div className="absolute top-4 left-0 right-0 h-px bg-gray-200 mx-6">
        <div className="h-full bg-indigo-400 transition-all duration-500" style={{ width: `${((current - 1) / 4) * 100}%` }} />
      </div>
      {STEPS.map(s => {
        const done = current > s.n, active = current === s.n;
        return (
          <div key={s.n} className="relative flex flex-col items-center gap-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-indigo-600 border-indigo-600 text-white" : active ? "bg-white border-indigo-600 text-indigo-600 shadow-md" : "bg-white border-gray-300 text-gray-400"}`}>{done ? "✓" : s.n}</div>
            <span className={`text-xs font-medium ${active ? "text-indigo-700" : done ? "text-gray-600" : "text-gray-400"}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function canAdvance(step: StepNumber, data: RoutineData): boolean {
  if (step === 1) return data.description.trim().length >= 20;
  if (step === 2) return data.whatSpecific.trim().length > 0 && data.whyValue.trim().length > 0;
  if (step === 3) return Object.keys(data.senseCheckAnswers).length === CRITERIA.length;
  return true;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoutineBuilder() {
  const [step, setStep] = useState<StepNumber>(1);
  const [data, setData] = useState<RoutineData>(INITIAL);
  const update = (u: Partial<RoutineData>) => setData(prev => ({ ...prev, ...u }));
  const next = () => { if (step < 5 && canAdvance(step, data)) setStep(s => (s + 1) as StepNumber); };
  const back = () => { if (step > 1) setStep(s => (s - 1) as StepNumber); };
  const reset = () => { setData(INITIAL); setStep(1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Powered by create-routine</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Routine Builder</h1>
          <p className="text-gray-500">Design an automation worth building — step by step.</p>
        </div>

        <Progress current={step} />

        {step === 1 && <Step1 data={data} onChange={update} />}
        {step === 2 && <Step2 data={data} onChange={update} />}
        {step === 3 && <Step3 data={data} onChange={update} />}
        {step === 4 && <Step4 data={data} onChange={update} />}
        {step === 5 && <Step5 data={data} onReset={reset} />}

        {step < 5 && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={back} disabled={step === 1} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Back</button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Step {step} of 5</span>
              <button onClick={next} disabled={!canAdvance(step, data)} className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">{step === 4 ? "Generate routine" : "Continue"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
