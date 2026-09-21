import fs from 'node:fs';
import path from 'node:path';
import {
  canonicalizeClasses,
  loadThemeFromCss,
} from 'tailwind-canonicalize';
import type { Rule, SourceCode } from 'eslint';
import type { CanonicalizationContext, RuleOptions } from './types.js';

type Theme = ReturnType<typeof loadThemeFromCss>;
type CanonicalizationCache = Map<string, unknown>;

interface ThemeCacheEntry {
  mtimeMs: number;
  size: number;
  theme: Theme;
  canonicalizationsByRootFontSize: Map<number, CanonicalizationCache>;
}

const themeCache = new Map<string, ThemeCacheEntry>();

function loadTheme(cssPath: string): ThemeCacheEntry | null {
  let stats: fs.Stats;
  try {
    stats = fs.statSync(cssPath);
  } catch {
    return null;
  }

  let cached = themeCache.get(cssPath);
  if (
    !cached ||
    cached.mtimeMs !== stats.mtimeMs ||
    cached.size !== stats.size
  ) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    cached = {
      mtimeMs: stats.mtimeMs,
      size: stats.size,
      theme: loadThemeFromCss(cssContent),
      canonicalizationsByRootFontSize: new Map(),
    };
    themeCache.set(cssPath, cached);
  }

  return cached;
}

function createCanonicalizer(
  cssPath: string,
  rootFontSize: number,
): (candidates: string[]) => string[] | null {
  let loadedTheme: ThemeCacheEntry | null | undefined;

  return (candidates) => {
    if (loadedTheme === undefined) {
      loadedTheme = loadTheme(cssPath);
    }
    if (!loadedTheme) {
      return null;
    }

    let canonicalizations =
      loadedTheme.canonicalizationsByRootFontSize.get(rootFontSize);
    if (!canonicalizations) {
      canonicalizations = new Map();
      loadedTheme.canonicalizationsByRootFontSize.set(
        rootFontSize,
        canonicalizations,
      );
    }

    return canonicalizeClasses(candidates, {
      theme: loadedTheme.theme,
      rootFontSizePx: rootFontSize,
      cache: canonicalizations,
    });
  };
}

export interface ResolvedCssPath {
  cssPath: string;
  resolvedViaWalkUp: boolean;
}

export function resolveCssPath(
  options: RuleOptions,
  cwd: string,
  filename: string | undefined,
): ResolvedCssPath {
  let cssPath: string;
  let resolvedViaWalkUp = false;

  if (path.isAbsolute(options.cssPath)) {
    cssPath = path.normalize(options.cssPath);
  } else {
    cssPath = path.normalize(path.resolve(cwd, options.cssPath));

    if (!fs.existsSync(cssPath)) {
      resolvedViaWalkUp = true;
      if (filename) {
        let dir = path.dirname(filename);
        const root = path.parse(dir).root;
        while (dir !== root) {
          const candidate = path.normalize(path.resolve(dir, options.cssPath));
          if (fs.existsSync(candidate)) {
            cssPath = candidate;
            break;
          }
          const parent = path.dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
      }
    }
  }

  return { cssPath, resolvedViaWalkUp };
}

export interface RuleSetupResult {
  disabled: boolean;
  reportCssNotFound?: { path: string };
  context?: CanonicalizationContext;
}

function resolveSourceCode(context: Rule.RuleContext): SourceCode {
  return context.sourceCode;
}

export function setupRuleContext(
  context: Rule.RuleContext,
  options: RuleOptions | undefined,
): RuleSetupResult {
  const sourceCode = resolveSourceCode(context);
  const cwd = context.cwd ?? process.cwd();

  if (!options?.cssPath) {
    return {
      disabled: false,
      reportCssNotFound: { path: 'not specified' },
    };
  }

  const filename = context.filename;
  const { cssPath, resolvedViaWalkUp } = resolveCssPath(options, cwd, filename);

  if (!fs.existsSync(cssPath)) {
    if (resolvedViaWalkUp) {
      return { disabled: true };
    }
    return {
      disabled: false,
      reportCssNotFound: { path: cssPath },
    };
  }

  const rootFontSize = options.rootFontSize ?? 16;
  const calleeFunctions = options.calleeFunctions ?? [
    'cn',
    'clsx',
    'classNames',
    'twMerge',
    'cva',
  ];

  return {
    disabled: false,
    context: {
      cssPath,
      rootFontSize,
      calleeFunctions,
      sourceText: sourceCode.getText(),
      canonicalizeClasses: createCanonicalizer(cssPath, rootFontSize),
    },
  };
}

export function getSourceCode(context: Rule.RuleContext) {
  return resolveSourceCode(context);
}
