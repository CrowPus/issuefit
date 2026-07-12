#!/usr/bin/env bash
# Tests raw TCP connectivity to Postgres before running migrations, so a
# network-level failure (unreachable host, closed port, firewall) is reported
# clearly instead of being silently swallowed by drizzle-kit's spinner UI.
set -uo pipefail

host="${POSTGRES_HOST:?POSTGRES_HOST is not set}"
port="${POSTGRES_PORT:-5432}"

echo "Testing TCP connectivity to ${host}:${port}..."
if timeout 5 bash -c "echo > /dev/tcp/${host}/${port}" 2>/dev/null; then
  echo "TCP connection to Postgres succeeded."
else
  echo "TCP connection to Postgres FAILED — this VM cannot reach ${host}:${port}."
  echo "Check: Postgres is running and listening on this address (not just localhost)," \
    "its pg_hba.conf allows this VM's IP, and its firewall allows inbound port ${port} from this VM."
  exit 1
fi
