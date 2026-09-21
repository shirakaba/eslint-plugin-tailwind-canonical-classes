import type { Rule } from 'eslint';
import type { CanonicalizationContext, ClassSource } from './types.js';

export function reportClassSources(
  context: Rule.RuleContext,
  sources: ClassSource[],
  ctx: CanonicalizationContext,
): void {
  if (sources.length === 0) {
    return;
  }

  try {
    const candidates = sources.flatMap((source) => source.classes);
    const canonicalized = ctx.canonicalizeClasses(candidates);

    if (canonicalized === null) {
      for (const source of sources) {
        context.report({
          node: source.cssNotFoundNode ?? source.reportNode,
          messageId: 'cssNotFound',
          data: { path: ctx.cssPath },
        });
      }
      return;
    }

    let offset = 0;
    for (const source of sources) {
      const canonicalizedSource = canonicalized.slice(
        offset,
        offset + source.classes.length,
      );
      offset += source.classes.length;
      const errors: Array<{
        original: string;
        canonical: string;
        index: number;
      }> = [];

      source.classes.forEach((className, index) => {
        const canonical = canonicalizedSource[index];
        if (canonical && canonical !== className) {
          errors.push({ original: className, canonical, index });
        }
      });

      if (errors.length === 0) {
        continue;
      }

      const fixedClasses = [...source.classes];
      errors.forEach((error) => {
        fixedClasses[error.index] = error.canonical;
      });
      const replacementText = source.buildFix(fixedClasses);

      errors.forEach((error, errorIndex) => {
        context.report({
          node: source.reportNode,
          messageId: 'nonCanonical',
          data: {
            original: error.original,
            canonical: error.canonical,
          },
          fix:
            errorIndex === 0
              ? (fixer) =>
                  fixer.replaceTextRange(source.fixRange, replacementText)
              : undefined,
        });
      });
    }
  } catch {
    // A canonicalization failure must not prevent the rest of ESLint from running.
  }
}
