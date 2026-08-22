# BirthdayBot Changelog
All notable changes to the BirthdayBot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- A test suite. There was none; there are now 76 tests over the notification window,
  the date handling, the HTTP layer, the validators and the storage repository.
- `.github/dependabot.yml`, covering npm, GitHub Actions and the Dockerfile.
- `CONTRIBUTING.md`, `CHANGELOG.md` and a `LICENSE` file to match the `MIT` licence
  the package manifest always claimed.
- Deployment to a Debian host over SSH, with a post-deploy check that watches all four
  containers for a restart-count delta before declaring success.

### Changed
- The four services are now a pnpm workspace of six packages rather than an Nx 12
  workspace. The `apps/` and `libs/` split is kept: `apps/` holds the four runnable
  services, one Docker image each, and `libs/` the shared code, which is never an
  image of its own. `nx.json`, `workspace.json`, `tools/`, the seven per-project
  `tsconfig`/`eslintrc`/`jest.config` triads and the three `.babelrc` files are gone.
- Node 14 to **Node 24**, and TypeScript 4.2 to 5.9.
- **There is no build step.** Node runs the TypeScript in `apps/*/src` and
  `libs/*/src` directly, stripping types as it loads. `tsc` only typechecks, and
  `erasableSyntaxOnly` keeps that honest.
- TypeORM 0.2, `sqlite3` and `@ionaru/typeorm-utils` replaced by the built-in
  `node:sqlite`. The schema is unchanged, so an existing `birthday.db` opens as is.
- Express, `@ionaru/micro-web-service`, `http-proxy` and `ajv` replaced by
  `node:http` and hand-written validators; `axios` replaced by `fetch`.
- discord.js 12 to 14, and `slash-create` dropped entirely: v14 handles interactions
  natively, so the gateway `INTERACTION_CREATE` hook and the application public key it
  needed are no longer used.
- `moment` and `moment-timezone` replaced by `Intl` and plain UTC `Date` arithmetic.
- `cron` replaced by a self-rescheduling timer.
- `uuid` replaced by `crypto.randomUUID()`.
- The `debug` package replaced by a dependency-free reimplementation of its namespace
  semantics in `libs/common/src/debug.ts`. `DEBUG=birthday-bot*` keeps working.
- Jest replaced by Node's built-in test runner, and `@ionaru/eslint-config` (which
  peer-pins ESLint to `7.17.0 - 8`) by a local ESLint 10 flat config.
- Deployment moved from a private registry and TeamCity to GHCR and `docker compose`
  over SSH. Each service is a separate image, built from one Dockerfile.
- Environment variables renamed `BB_*` to `BIRTHDAYBOT_*`. The inter-service URLs and
  ports now default to the Compose service names, so only the two Discord credentials
  have to be set.
- Slash commands register globally when `BIRTHDAYBOT_GUILDS` is unset, instead of
  refusing to start.

### Removed
- Every runtime dependency except `discord.js`: `@ionaru/array-utils`,
  `@ionaru/micro-web-service`, `@ionaru/typeorm-utils`, `axios`, `cron`, `debug`,
  `dotenv`, `express`, `fastify` (which was never imported), `http-proxy`,
  `http-status-codes`, `moment-timezone`, `reflect-metadata`, `rxjs`, `slash-create`,
  `sqlite3`, `supports-color`, `tslib`, `typeorm` and `uuid`.
- The TSLint bridge (`tslint`, `@typescript-eslint/eslint-plugin-tslint`), which had no
  `tslint.json` to read and had been dead for years, along with the
  `/* eslint-disable @typescript-eslint/tslint/config */` comments it required.
- Prettier. `.editorconfig` and ESLint's stylistic rules are the only formatting
  authority now.
- `BB_DISCORD_KEY`. The application public key only matters for HTTP-based
  interactions, which this bot has never used.

### Fixed
- **Notifications never fired across New Year.** The window check pinned the birthday
  to the current year, so on 28 December a 5 January birthday was compared against a
  date 357 days in the past and matched nothing. It now looks at the next occurrence,
  whichever year that falls in.
- **A successful `POST /storage` returned `{}`.** The handler did not await
  `createBirthday`, so it serialised a pending promise; a database failure became an
  unhandled rejection instead of a 500.
- **`/add-birthday` filed some birthdays in the past.** The "has it already happened
  this year" test was `month <= currentMonth && day <= currentDay`, which is not a date
  comparison: on 22 August a 30 March birthday failed the day half and was stored under
  the current year.
- A 29 February birthday can now be added without giving a year (it is filed under the
  next leap year) and is observed on 28 February in common years, rather than being
  normalised to 1 March, after the fact.
- `/list-birthdays` and the notifications no longer fetch the entire guild member
  list, which under discord.js 14 would have required the privileged **GuildMembers**
  intent. Only the users being named are fetched, over REST. BirthdayBot needs no
  privileged intents.
- The notification route no longer puts a caught error object straight into the
  response body.
- **Every slash command appeared twice.** Discord keeps global and guild commands in
  separate buckets and shows both, and a bulk PUT only overwrites the bucket it
  targets. The pre-2026 bot always registered guild-scoped (it refused to start without
  `BB_DISCORD_GUILDS`), so moving to global registration left the 2021 guild
  registrations in place as a duplicate of every command, which Discord never expires.
  Registration now treats the configured scope as the only scope and empties the other
  one, which makes a redeploy self-healing. Note the implication: two deployments
  sharing one Discord application will now clear each other's commands instead of
  duplicating them, so development wants its own application.
- A slash command that fails for an unexpected reason no longer flashes the internal
  error text at the user before replacing it with the generic message a moment later.
  Only a `HandledError` is shown; everything else is reported generically.
- The storage container no longer crash-loops on a bind-mounted data directory it does
  not own. `deploy/entrypoint.sh` takes ownership of `/app/data` and then drops to the
  unprivileged `node` user. Without it, a fresh self-host failed with "unable to open
  database file" (Docker creates a missing bind source as `root:root`) and an in-place
  upgrade failed with "attempt to write a readonly database" (the old image ran as
  root, so the existing `birthday.db` is root-owned).

[Unreleased]: https://github.com/Ionaru/birthday-bot/compare/aed2472...HEAD
