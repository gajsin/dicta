export interface Token {
  text: string;
  status: 'normal' | 'added' | 'removed';
}

export interface ComparisonAnalysis {
  state: 'identical' | 'punctuation_only' | 'missing_raw' | 'missing_processed' | 'substantially_rewritten' | 'normal';
  rawTokens: Token[];
  processedTokens: Token[];
}

export function computeTextDiff(rawText?: string, processedText?: string): ComparisonAnalysis {
  const raw = (rawText || '').trim();
  const proc = (processedText || '').trim();

  if (!raw && !proc) {
    return { state: 'identical', rawTokens: [], processedTokens: [] };
  }
  if (!raw && proc) {
    return {
      state: 'missing_raw',
      rawTokens: [],
      processedTokens: proc.split(/\s+/).map(w => ({ text: w, status: 'normal' }))
    };
  }
  if (raw && !proc) {
    return {
      state: 'missing_processed',
      rawTokens: raw.split(/\s+/).map(w => ({ text: w, status: 'normal' })),
      processedTokens: []
    };
  }
  if (raw === proc) {
    const tokens = proc.split(/\s+/).map(w => ({ text: w, status: 'normal' as const }));
    return { state: 'identical', rawTokens: tokens, processedTokens: tokens };
  }

  const stripPunct = (s: string) => s.toLowerCase().replace(/[^\w\sа-яё]/gi, '').split(/\s+/).filter(Boolean);
  const rawWordsClean = stripPunct(raw);
  const procWordsClean = stripPunct(proc);

  const isPunctOnly = rawWordsClean.join(' ') === procWordsClean.join(' ');

  const rawSet = new Set(rawWordsClean);
  const procSet = new Set(procWordsClean);
  let commonCount = 0;
  for (const w of rawWordsClean) {
    if (procSet.has(w)) commonCount++;
  }
  const maxLen = Math.max(rawWordsClean.length, procWordsClean.length);
  const overlapRatio = maxLen > 0 ? commonCount / maxLen : 1;

  const isSubstantiallyRewritten = !isPunctOnly && overlapRatio < 0.35 && (rawWordsClean.length > 5 || procWordsClean.length > 5);

  // Build side-by-side tokens preserving natural sentence order
  const rawWords = raw.split(/(\s+)/);
  const procWords = proc.split(/(\s+)/);

  const rawTokens: Token[] = rawWords.map(w => {
    if (!w.trim()) return { text: w, status: 'normal' };
    const cleanW = w.toLowerCase().replace(/[^\wа-яё]/gi, '');
    const isRemoved = cleanW && !procSet.has(cleanW) && !isPunctOnly;
    return { text: w, status: isRemoved ? 'removed' : 'normal' };
  });

  const processedTokens: Token[] = procWords.map(w => {
    if (!w.trim()) return { text: w, status: 'normal' };
    const cleanW = w.toLowerCase().replace(/[^\wа-яё]/gi, '');
    const isAdded = cleanW && !rawSet.has(cleanW) && !isPunctOnly;
    return { text: w, status: isAdded ? 'added' : 'normal' };
  });

  let state: ComparisonAnalysis['state'] = 'normal';
  if (isPunctOnly) state = 'punctuation_only';
  else if (isSubstantiallyRewritten) state = 'substantially_rewritten';

  return { state, rawTokens, processedTokens };
}
