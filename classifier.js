import {
  DEFAULTS,
  ISSUE_TYPE,
  QUICK,
  SUB,
  cleanSentence,
  cleanLabelSentence,
  low,
  normText,
  slugifyRule
} from "./utils.js";
import { preprocessLine } from "./parser.js";
import { CLASSIFICATION_RULES } from "./rules.js";
import { classifyWithAI } from "./aiClassifier.js";

function rawIssueTextFromLine(line) {
  return String(line || "")
    .replace(/^\s*[^.]+\.\s*/, "")
    .replace(/\s*\d{1,2}:\d{2}\s*$/, "")
    .trim();
}

function withMeta(result, rawTxt, ruleInfo) {
  const rawNormalized = rawIssueTextFromLine(rawTxt);
  const issueDesc = cleanSentence(result.issueDesc || "");
  const recovery = cleanSentence(result.recovery || "");
  const fallback =
    !issueDesc ||
    cleanLabelSentence(issueDesc) === cleanLabelSentence(rawNormalized);

  return {
    ...result,
    issueDesc,
    recovery,
    ruleId: fallback
      ? "fallback_default"
      : ruleInfo?.id || `legacy_${slugifyRule(issueDesc)}`,
    ruleLabel: fallback
      ? "Not matched / raw passthrough"
      : (ruleInfo?.label || issueDesc),
    matchedKeywords: ruleInfo?.keywords || [],
    confidence: fallback ? "low" : (ruleInfo?.confidence || "high")
  };
}

function makeFallbackResult(txt, line, opts = {}) {
  const issueDesc = rawIssueTextFromLine(line || txt);

  return {
    issueType: ISSUE_TYPE.Equipment,
    quick: QUICK.UnableDrive,
    subType: SUB.CannotLocate,
    issueDesc: cleanSentence(issueDesc),
    recovery: cleanSentence(opts.defaultRecovery || DEFAULTS.recovery),
    minutes: Number(opts.defaultMin) || DEFAULTS.minutes,
    txt,
    ruleId: "fallback_default",
    ruleLabel: "Not matched / raw passthrough",
    matchedKeywords: [],
    confidence: "low"
  };
}

function normalizeInput(line) {
  const txt = normText(preprocessLine(line))
    .replace(/unable to rotate/ig, "unable to rotate")
    .replace(/dirty dm code/ig, "dirty dm code")
    .replace(/lost dm code/ig, "missing dm code");

  return {
    txt,
    L: low(txt)
  };
}

export function classify(line, opts = {}) {
  const { txt, L } = normalizeInput(line);

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.match(L, txt)) {
      const result =
        typeof rule.result === "function"
          ? rule.result(L, txt)
          : rule.result;

      return withMeta({ ...result, txt }, line, rule);
    }
  }

  return makeFallbackResult(txt, line, opts);
}

function shouldUseAIFallback(result) {
  return (
    !result ||
    result.confidence === "low" ||
    result.ruleId === "fallback_default"
  );
}

function normalizeAIResult(aiResult, baseResult, opts = {}) {
  if (!aiResult || typeof aiResult !== "object") return null;

  const issueDesc = cleanSentence(aiResult.issueDesc || "");
  if (!issueDesc) return null;

  const recovery = cleanSentence(
    aiResult.recovery || opts.defaultRecovery || DEFAULTS.recovery
  );

  const minutesNum = Number(aiResult.minutes);
  const minutes =
    Number.isFinite(minutesNum) && minutesNum > 0
      ? minutesNum
      : (Number(opts.defaultMin) || DEFAULTS.minutes);

  return {
    issueType: aiResult.issueType || baseResult.issueType || ISSUE_TYPE.Equipment,
    quick: aiResult.quick || baseResult.quick || QUICK.UnableDrive,
    subType: aiResult.subType || baseResult.subType || SUB.CannotLocate,
    issueDesc,
    recovery,
    minutes,
    txt: baseResult.txt,
    ruleId: "ai_fallback",
    ruleLabel: "AI fallback classification",
    matchedKeywords: [],
    confidence: aiResult.confidence || "medium"
  };
}

export async function classifyWithFallback(line, opts = {}) {
  const baseResult = classify(line, opts);

  if (!shouldUseAIFallback(baseResult)) {
    return baseResult;
  }

  try {
    const aiResult = await classifyWithAI(line, {
      defaultRecovery: opts.defaultRecovery || DEFAULTS.recovery,
      defaultMin: Number(opts.defaultMin) || DEFAULTS.minutes,
      baseResult
    });

    const normalized = normalizeAIResult(aiResult, baseResult, opts);
    return normalized || baseResult;
  } catch (error) {
    console.error("AI fallback failed:", error);
    return baseResult;
  }
}