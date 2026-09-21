import svelteParser from 'svelte-eslint-parser';
import vueParser from 'vue-eslint-parser';

export function getTestCssPath(filename = 'tailwind.css') {
  return new URL(`./fixtures/${filename}`, import.meta.url).pathname;
}

export function getRuleTesterConfig() {
  return {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  };
}

export function getSvelteRuleTesterConfig() {
  return {
    languageOptions: {
      parser: svelteParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  };
}

export function getVueRuleTesterConfig() {
  return {
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  };
}
