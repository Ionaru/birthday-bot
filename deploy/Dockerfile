# Node runs the TypeScript in apps/*/src and libs/*/src directly, stripping types as
# it loads, so there is nothing to compile and no build stage.
#
# `pnpm deploy` is deliberately not used here, even though pruning a workspace into a
# self-contained directory is exactly what it is for. Two things rule it out:
#
#   1. It relocates workspace packages under node_modules/.pnpm/..., and Node refuses
#      to strip types for files whose real path is inside node_modules. The container
#      would fail at startup with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING.
#      (pnpm/pnpm#10602)
#   2. Since pnpm 11.19.0 it symlinks workspace dependencies back to the source tree
#      rather than copying them, so the output is not self-contained and does not
#      survive being copied anywhere. (pnpm/pnpm#13754)
#
# Copying the workspace and installing with a filter keeps the ordinary layout, where
# apps/<service>/node_modules/@birthday-bot/common is a symlink to ../../../libs/common.
# That real path is outside node_modules, so type stripping works.
FROM node:24-alpine

ARG SERVICE
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production
ENV SERVICE=${SERVICE}

WORKDIR /app

RUN corepack enable

# su-exec lets the entrypoint drop from root to the node user without forking; see
# deploy/entrypoint.sh for why the container has to start as root at all.
RUN apk add --no-cache su-exec

# The pnpm version comes from the "packageManager" field in package.json.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Both directories are copied whatever the service: the workspace has to be complete
# for pnpm to resolve it, and the filter below is what decides which of them actually
# get their dependencies installed. The sources are a few dozen kilobytes of
# TypeScript, so copying all of them costs nothing.
COPY libs ./libs
COPY apps ./apps

# `<pattern>...` selects the package and its dependencies, so each image installs only
# its own subtree: the storage image never sees discord.js, which is the only runtime
# dependency in the repository. `--prod` is what drops the root's devDependencies,
# which the filter alone does not: without it, eslint and typescript ship too.
RUN pnpm install --frozen-lockfile --prod --filter "@birthday-bot/${SERVICE}..." \
    && pnpm store prune

# Only the storage service writes here, but the directory is harmless elsewhere and
# keeps a single Dockerfile serving all four.
RUN mkdir -p /app/data && chown -R node:node /app

# The entrypoint fixes ownership of a mounted /app/data and then drops to the node
# user, so there is deliberately no USER directive here: it has to start as root to be
# able to chown, and never runs the service as root.
COPY deploy/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Exec-form CMD does not expand variables, hence the shell. `exec` keeps node at PID 1
# so that SIGTERM reaches the shutdown handler instead of the shell.
CMD ["sh", "-c", "exec node apps/$SERVICE/src/index.ts"]
