#!/bin/sh
# Runs a command with the local stack's generated OIDC settings.
#
#   with-generated-env.sh [KEY=default ...] -- command [args ...]
#
# The api and spa services use this as their entrypoint in docker-compose.yml.
# zitadel-init writes Zitadel's generated IDs to /bootstrap/generated.env, and
# compose can't pass them in through env_file: it reads env files once, when it
# loads the project, before zitadel-init has run. So the file is read here,
# when the container starts.
#
# Only the file's OIDC_* keys are taken (not the ZITADEL_* IDs or the service
# account's secret), and they override the container's environment: while the
# file exists, it wins over the shell and .env. Delete it (make spa-stop does)
# to use another IdP. Each KEY=default argument then fills its key if it is
# still unset or empty, as compose's ${KEY:-default} did.
set -e

GENERATED_ENV="${GENERATED_ENV:-/bootstrap/generated.env}"

set_if_unset() {
  case "$1" in
    "" | [0-9]* | *[!A-Za-z0-9_]*) return 0 ;;
  esac
  if eval "[ -z \"\${$1:-}\" ]"; then
    export "$1=$2"
  fi
}

if [ -f "$GENERATED_ENV" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      OIDC_*=*) ;;
      *) continue ;;
    esac
    key="${line%%=*}"
    case "$key" in
      *[!A-Za-z0-9_]*) continue ;;
    esac
    export "$key=${line#*=}"
  done < "$GENERATED_ENV"
fi

while [ $# -gt 0 ] && [ "$1" != "--" ]; do
  set_if_unset "${1%%=*}" "${1#*=}"
  shift
done
if [ "$1" = "--" ]; then
  shift
fi
if [ $# -eq 0 ]; then
  echo "usage: $0 [KEY=default ...] -- command [args ...]" >&2
  exit 64
fi

exec "$@"
