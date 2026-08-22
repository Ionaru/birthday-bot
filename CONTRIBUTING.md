# Contributing

Hey, welcome to the party! 🎉

Thank you so much for your interest in contributing to BirthdayBot!


## Asking questions, suggesting wonderful ideas or reporting bugs

You can [submit an issue️](https://github.com/Ionaru/birthday-bot/issues) on this GitHub repository.


## Coding

### 📦 Prerequisites

You need **Node.js 24 or newer**. BirthdayBot runs its TypeScript directly, without a
build step, and stores its data through the built-in `node:sqlite` module; neither
works on older versions.

Get it from [the official Node.js website](https://nodejs.org/en/download/), or with a
version manager such as [fnm](https://github.com/Schniz/fnm) or
[nvm](https://github.com/nvm-sh/nvm).

pnpm comes from Corepack, which ships with Node:

```bash
corepack enable
```

The version in `package.json`'s `packageManager` field is the one that will be used.


### 🏗️ Installation

First, clone this repository:

```bash
git clone https://github.com/Ionaru/birthday-bot.git
cd birthday-bot
```

Then install the required dependencies:

```bash
pnpm install
```

Yay! You are ready! 🍾


### 🗂️ Layout

The repository is a pnpm workspace with a deliberate split:

```
apps/   one runnable service per directory, one Docker image each
libs/   shared code, imported by the apps, never an image of its own
```

Two boundaries are enforced by ESLint, because nothing else does now that Nx and its
`enforce-module-boundaries` rule are gone:

* Nothing in `libs/` may import from `apps/`. Shared code stays shared.
* No app may import another app. The four are separate processes that talk over HTTP;
  importing across them would compile fine and then be wrong at runtime.

Adding a service means a new directory under `apps/` with a `start` script, and a
matching entry in `deploy/compose.yaml`. Adding shared code means a new directory under
`libs/`. The workspace globs and the Dockerfile pick both up without further changes.

### 🧪 Checks

```bash
pnpm run check      # Everything below, in order
pnpm run lint       # ESLint
pnpm run typecheck  # tsc, which only typechecks and emits nothing
pnpm run test       # Node's built-in test runner
```

`pnpm run typecheck` is not optional busywork: `erasableSyntaxOnly` in
`tsconfig.json` is what stops anything Node cannot strip (enums, constructor
parameter properties, decorators) from reaching a container that has no compiler.


### ⤴️ Pull requests

Please make sure any code you submit is compliant and compatible with this
repository's [license](./LICENSE).

#### Your first pull request
1. [Create a fork of this project](https://github.com/Ionaru/birthday-bot/fork).
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/birthday-bot.git`.
3. Add the original repository as remote to keep it up-to-date: `git remote add upstream https://github.com/Ionaru/birthday-bot.git`.
4. Fetch the latest changes from upstream: `git fetch upstream`.
5. Create a new branch to work on: `git checkout -b MyNewFeatureName`.
6. Write some awesome improvements, tests and commit your work.
7. Make sure your changes comply with the established code: `pnpm run check`.
8. Push your changes to GitHub: `git push origin`.
9. On GitHub, go to your forked branch, and click **New pull request**.
10. Choose the correct branches, add a description and submit your pull request!

#### Continuing development
To create more pull requests, please follow the steps below:
1. Go back to the main branch: `git checkout main`.
2. Fetch the upstream changes: `git fetch upstream`.
3. Update the main branch with upstream changes: `git merge upstream/main`.
4. Repeat ["Your first pull request"](#your-first-pull-request) from step 5.

Thank you! 💜
