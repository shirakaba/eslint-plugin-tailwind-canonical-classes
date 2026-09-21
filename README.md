# @shirakaba/eslint-plugin-tailwind-canonical-classes

A speedy fork of [eslint-plugin-tailwind-canonical-classes](https://github.com/MaisonnatM/eslint-plugin-tailwind-canonical-classes) that works by running `tailwind-canonicalize` in-process rather than spinning up a `@tailwindcss/node` worker.

| Measurement          | Original (v1.4.1) | This fork (v2.0.0) |
| -------------------- | ----------------: | -----------------: |
| Plugin rule time     |        1,684.8 ms |         **4.1 ms** |
| Next app lint median |            2.86 s |         **1.06 s** |

[![npm version](https://img.shields.io/npm/v/@shirakaba/eslint-plugin-tailwind-canonical-classes.svg)](https://www.npmjs.com/package/@shirakaba/eslint-plugin-tailwind-canonical-classes)
[![npm downloads](https://img.shields.io/npm/dm/@shirakaba/eslint-plugin-tailwind-canonical-classes.svg)](https://www.npmjs.com/package/@shirakaba/eslint-plugin-tailwind-canonical-classes)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen.svg)](https://nodejs.org/)

> Fast, auto-fixable ESLint enforcement for canonical Tailwind CSS v4 class names.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Options](#-options)
- [Usage Examples](#-usage-examples)
- [How It Works](#-how-it-works)
- [Limitations](#-limitations)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Related Links](#-related-links)

## ✨ Features

- 🔍 **Automatic Detection**: Automatically detects non-canonical Tailwind CSS class names in JSX/TSX, Svelte, and Vue files
- 🔧 **Auto-fix Support**: Automatically fixes non-canonical classes using ESLint's auto-fix feature
- 🎯 **Tailwind CSS v4 Integration**: Uses the same safe canonicalization engine as `tailwind-canonicalize`
- 📝 **Multiple Format Support**: Works with string literals, template literals, and JSX expressions
- 🛠️ **Utility Function Support**: Detects and fixes classes in utility functions like `cn()`, `clsx()`, `classNames()`, `twMerge()`, and `cva()`
- ⚡ **Low Overhead**: Runs in-process with shared theme and candidate caches—no worker or Tailwind compiler startup

## 📦 Installation

Install the plugin, aliasing it to `eslint-plugin-tailwind-canonical-classes`:

```bash
npm install --save-dev eslint-plugin-tailwind-canonical-classes@npm:@shirakaba/eslint-plugin-tailwind-canonical-classes
```

Or with yarn:

```bash
yarn add -D eslint-plugin-tailwind-canonical-classes@npm:@shirakaba/eslint-plugin-tailwind-canonical-classes
```

Or with pnpm:

```bash
pnpm add -D eslint-plugin-tailwind-canonical-classes@npm:@shirakaba/eslint-plugin-tailwind-canonical-classes
```

### Requirements

- **Node.js** >= 20.19.0
- **ESLint** 9 or 10 using flat config
- **Tailwind CSS** v4
- **svelte-eslint-parser** (optional, required for Svelte support)
- **vue-eslint-parser** (optional, required for Vue support)

### ESLint Version Compatibility

| ESLint Version | Flat Config (`eslint.config.*`) |
| :------------: | :-----------------------------: |
|      9.x       |            Supported            |
|      10.x      |            Supported            |

Legacy `.eslintrc` configuration is not supported.

## 🚀 Quick Start

1. **Install the plugin** (see [Installation](#-installation))

2. **Add to your ESLint config** (`eslint.config.mjs`):

   ```javascript
   import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

   export default [
     ...tailwindCanonicalClasses.configs["flat/recommended"],
     {
       rules: {
         "tailwind-canonical-classes/tailwind-canonical-classes": [
           "warn",
           {
             cssPath: "./app/styles/globals.css",
           },
         ],
       },
     },
   ];
   ```

3. **Run ESLint**:
   ```bash
   npx eslint . --fix
   ```

## ⚙️ Configuration

### Flat Config

Using the built-in `flat/recommended` config:

```javascript
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  ...tailwindCanonicalClasses.configs["flat/recommended"],
  {
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn", // or 'error'
        {
          cssPath: "./app/styles/globals.css", // Required
          rootFontSize: 16, // Optional, default: 16
          calleeFunctions: ["cn", "clsx"], // Optional, default: ['cn', 'clsx', 'classNames', 'twMerge', 'cva']
        },
      ],
    },
  },
];
```

### Svelte (Flat Config)

Install the Svelte parser alongside the plugin:

```bash
npm install --save-dev svelte-eslint-parser
```

Then extend the built-in config:

```javascript
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  ...tailwindCanonicalClasses.configs["flat/svelte"],
  {
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./src/app.css",
        },
      ],
    },
  },
];
```

### Vue (Flat Config)

Install the Vue parser alongside the plugin:

```bash
npm install --save-dev vue-eslint-parser
```

Then extend the built-in config:

```javascript
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  ...tailwindCanonicalClasses.configs["flat/vue"],
  {
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./src/style.css",
        },
      ],
    },
  },
];
```

Or with manual plugin registration:

```javascript
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  {
    plugins: {
      "tailwind-canonical-classes": tailwindCanonicalClasses,
    },
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./app/styles/globals.css",
        },
      ],
    },
  },
];
```

## 📖 Options

### `cssPath` (required)

- **Type**: `string`
- **Description**: Path to your Tailwind CSS file
- **Supported formats**:
  - Relative path: Resolved relative to your project root (where ESLint config is located)
  - Absolute path: Full filesystem path to your CSS file

**Examples**:

```javascript
cssPath: "./app/styles/globals.css"; // Relative to project root
cssPath: "./src/index.css"; // Another relative example
cssPath: "/absolute/path/to/styles.css"; // Absolute path
```

### `rootFontSize` (optional)

- **Type**: `number`
- **Default**: `16`
- **Description**: Root font size in pixels for rem calculations. This should match your CSS root font size setting.

**Example**:

```javascript
rootFontSize: 16; // Default (16px = 1rem)
rootFontSize: 14; // If your root font size is 14px
```

### `calleeFunctions` (optional)

- **Type**: `string[]`
- **Default**: `['cn', 'clsx', 'classNames', 'twMerge', 'cva']`
- **Description**: Array of utility function names to check for Tailwind classes. The plugin will detect and canonicalize classes passed as string arguments to these functions.

**Example**:

```javascript
calleeFunctions: ["cn", "clsx"]; // Only check cn() and clsx()
calleeFunctions: ["customFn"]; // Check a custom utility function
```

## 💡 Usage Examples

### Basic Example

**Before:**

```tsx
<div className="p-[16px] m-[2rem]">Content</div>
```

**After auto-fix:**

```tsx
<div className="p-1 m-8">Content</div>
```

### Supported Formats

The plugin supports various class name formats:

1. **String literals**:

   ```tsx
   <div className="p-4 m-2">Content</div>
   ```

2. **Template literals** (static parts only):

   ```tsx
   <div className={`p-4 ${someVar}`}>Content</div>
   // Only "p-4" will be checked, dynamic parts are skipped
   ```

3. **JSX expression containers**:

   ```tsx
   <div className={"p-[16px]"}>Content</div>
   ```

4. **Utility functions** (e.g., `cn()`, `clsx()`, `classNames()`, `twMerge()`, `cva()`):
   ```tsx
   <div className={cn("p-[16px]", "m-[2rem]")}>Content</div>
   <div className={clsx("w-[16px]", condition && "hidden")}>Content</div>
   // Only string literal arguments are checked; dynamic expressions are skipped
   ```

### Real-world Example

```tsx
// Before
function Card({ children }) {
  return (
    <div className="p-[16px] m-[2rem] rounded-[8px] shadow-lg">{children}</div>
  );
}

// After auto-fix
function Card({ children }) {
  return <div className="p-4 m-8 rounded-2 shadow-lg">{children}</div>;
}
```

### Utility Function Example

```tsx
// Before
import { cn } from "@/lib/utils";

function Button({ variant, className }) {
  return (
    <button className={cn("w-[16px]", "h-[32px]", className)}>Click me</button>
  );
}

// After auto-fix
import { cn } from "@/lib/utils";

function Button({ variant, className }) {
  return <button className={cn("w-4", "h-8", className)}>Click me</button>;
}
```

## 🔧 How It Works

1. **Load Theme**: The plugin reads the CSS file once and extracts Tailwind v4 `@theme` values. Parsed themes and canonicalization results are shared across linted files.
2. **Extract Classes**: It extracts class names from:
   - JSX `className` attributes (string literals, template literals, JSX expressions)
   - Standalone script-level utility function calls (e.g. `cn()`, `clsx()`) outside class attributes
   - Svelte `class` attributes (static literals and mustache `cn()` / `clsx()` calls)
   - Vue `class`, `:class`, and `v-bind:class` attributes (static literals and `cn()` / `clsx()` calls)
   - Utility function calls inside class attributes — only string literal arguments are checked
3. **Canonicalize**: It applies the safe, synchronous `tailwind-canonicalize` resolver in-process. There is no worker startup or Tailwind compiler initialization.
4. **Report & Fix**: If a non-canonical class is found, it reports an error/warning and can auto-fix it

## ⚠️ Limitations

- **Static classes only**: Only works with static class names (no dynamic expressions)
- **Tailwind CSS v4 required**: Requires Tailwind CSS v4 (not compatible with v3)
- **CSS file accessibility**: CSS file must be accessible from the ESLint process
- **Template literals**: Static template literals are supported; template literals containing expressions are skipped
- **Utility functions**: Only string literal arguments are checked; dynamic expressions, variables, and conditional logic within utility functions are skipped
- **Framework parsers**: `flat/svelte` and `flat/vue` require `svelte-eslint-parser` and `vue-eslint-parser` respectively
- **Vue `:class` object/array forms**: Object and array `:class` bindings (for example `{ 'w-4': true }` or `['w-4', dynamic]`) are skipped

## 🐛 Troubleshooting

### Plugin not detecting classes

**Problem**: The plugin isn't reporting any issues with non-canonical classes.

**Solutions**:

1. Verify your `cssPath` is correct and points to a valid Tailwind CSS file
2. Ensure the CSS file is accessible from where ESLint runs
3. Check that your Tailwind CSS file contains valid Tailwind directives (`@import "tailwindcss"` or similar)
4. Verify ESLint is processing your JSX/TSX files (check your ESLint config includes these file types)

### Path resolution issues

**Problem**: ESLint can't find your CSS file.

**Solutions**:

- Use an absolute path if relative paths aren't working
- Ensure the path is relative to your ESLint config file location
- Check file permissions

### Auto-fix not working

**Problem**: ESLint reports issues but doesn't auto-fix them.

**Solutions**:

- Run ESLint with the `--fix` flag: `npx eslint . --fix`
- Ensure your editor's ESLint extension has auto-fix enabled
- Check that the rule severity is set to `'warn'` or `'error'` (not `'off'`)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/shirakaba/eslint-plugin-tailwind-canonical-classes.git
cd eslint-plugin-tailwind-canonical-classes

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Release Process

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated version management and npm publishing. Releases are automatically triggered when commits are pushed to the `main` branch.

**Commit Message Format**:

- `fix:` - Patch release (1.0.8 → 1.0.9)
- `feat:` - Minor release (1.0.8 → 1.1.0)
- `feat!:` or `BREAKING CHANGE:` - Major release (1.0.8 → 2.0.0)

## 📄 License

MIT © [Maisonnat Maxence](https://github.com/MaisonnatM)

## 🔗 Related Links

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [ESLint Documentation](https://eslint.org/)
- [npm Package](https://www.npmjs.com/package/@shirakaba/eslint-plugin-tailwind-canonical-classes)
- [GitHub Repository](https://github.com/shirakaba/eslint-plugin-tailwind-canonical-classes)
- [Report an Issue](https://github.com/shirakaba/eslint-plugin-tailwind-canonical-classes/issues)
