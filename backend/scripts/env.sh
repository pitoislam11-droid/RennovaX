#!/bin/bash
# Shared environment setup for backend scripts

ENVIRONMENT="${ENVIRONMENT:-development}"

if [[ "${ENVIRONMENT}" == "production" ]]; then
  echo "Starting in production mode..."
  export NODE_ENV="production"
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "FATAL: DATABASE_URL must be set to the managed PostgreSQL database in production."
    exit 1
  fi
  if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?:// ]]; then
    echo "FATAL: Rennova production requires a PostgreSQL DATABASE_URL."
    exit 1
  fi
else
  echo "Starting in development mode..."
  export NODE_ENV="development"
fi
