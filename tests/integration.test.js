import { describe } from 'vitest';
import { RuleTester } from 'eslint';
import { getTestCssPath, getRuleTesterConfig } from './test-utils.js';
import tailwindCanonicalClasses from '../lib/rules/tailwind-canonical-classes.js';

describe('tailwind-canonical-classes (Integration)', () => {
  const cssPath = getTestCssPath();

  const ruleTester = new RuleTester(getRuleTesterConfig());

  ruleTester.run('tailwind-canonical-classes', tailwindCanonicalClasses, {
    valid: [
      {
        code: '<div className="flex items-center">Content</div>',
        options: [{ cssPath }],
      },
      {
        code: '<div className="w-4 h-8">Content</div>',
        options: [{ cssPath }],
      },
    ],

    invalid: [
      {
        code: '<div className="w-[16px]">Content</div>',
        output: '<div className="w-4">Content</div>',
        options: [{ cssPath }],
        errors: [
          {
            messageId: 'nonCanonical',
          },
        ],
      },
      {
        code: '<div className="bg-[#123456] w-[10px]">Content</div>',
        output: '<div className="bg-brand w-brand">Content</div>',
        options: [{ cssPath: getTestCssPath('custom-theme.css') }],
        errors: [
          { messageId: 'nonCanonical' },
          { messageId: 'nonCanonical' },
        ],
      },
    ],
  });
}, 30000);
