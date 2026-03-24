import { DEFAULTS, ISSUE_TYPE, QUICK, SUB, cleanSentence, cleanLabelSentence, low, normText, slugifyRule } from "./utils.js";
import { preprocessLine } from "./parser.js";
import { CLASSIFICATION_RULES } from "./rules.js";

function rawIssueTextFromLine(line){
  return String(line || "")
    .replace(/^\s*[^.]+\.\s*/, "")
    .replace(/\s*\d{1,2}:\d{2}\s*$/, "")
    .trim();
}

function withMeta(result, rawTxt, ruleInfo){
  const rawNormalized = rawIssueTextFromLine(rawTxt);
  const issueDesc = cleanSentence(result.issueDesc || "");
  const recovery = cleanSentence(result.recovery || "");
  const fallback = !issueDesc || cleanLabelSentence(issueDesc) === cleanLabelSentence(rawNormalized);

  return {
    ...result,
    issueDesc,
    recovery,
    ruleId: fallback ? "fallback_default" : ruleInfo?.id || `legacy_${slugifyRule(issueDesc)}`,
    ruleLabel: fallback ? "Not matched / raw passthrough" : (ruleInfo?.label || issueDesc),
    matchedKeywords: ruleInfo?.keywords || [],
    confidence: fallback ? "low" : (ruleInfo?.confidence || "high")
  };
}

export function classify(line, opts = {}){
  const txt = normText(preprocessLine(line))
    .replace(/unable to rotate/ig, "unable to rotate")
    .replace(/dirty dm code/ig, "dirty dm code")
    .replace(/lost dm code/ig, "missing dm code");

  const L = low(txt);

  for(const rule of CLASSIFICATION_RULES){
    if(rule.match(L, txt)){
      const result = typeof rule.result === "function" ? rule.result(L, txt) : rule.result;
      return withMeta({ ...result, txt }, line, rule);
    }
  }

  const issueDesc = rawIssueTextFromLine(txt);
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