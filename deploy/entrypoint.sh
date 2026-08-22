#!/bin/sh
# The services run as the unprivileged "node" user (uid 1000). Two things routinely
# hand them a /app/data they cannot write to:
#
#   1. A fresh self-host. The README documents BIRTHDAYBOT_DATA_VOLUME as an absolute
#      host path; if it does not exist yet, the Docker daemon creates the bind source
#      as root:root. Storage then dies at startup with "unable to open database file".
#   2. An upgrade. The pre-modernization storage image had no USER directive and ran as
#      root, so an existing birthday.db is root-owned. Storage dies with "attempt to
#      write a readonly database".
#
# Both are silent until the container crash-loops, so take ownership here instead of
# asking the operator to remember a chown. su-exec replaces this shell rather than
# forking, so the service still ends up as PID 1 and SIGTERM reaches its shutdown
# handler.
set -e

if [ "$(id -u)" = '0' ]; then
    if [ "$(stat -c '%u' /app/data)" != '1000' ]; then
        echo "birthday-bot: /app/data is not owned by the node user, taking ownership" >&2
    fi
    chown -R node:node /app/data
    exec su-exec node "$@"
fi

# Already unprivileged (someone passed `user:` in Compose, or `docker run --user`).
# Nothing to fix and no way to fix it; let the service report the problem itself.
exec "$@"
