#!/bin/sh
set -e

npm run dev &
NEXT_PID=$!

# Wait until Next.js is accepting connections
echo "[warmup] Waiting for Next.js dev server..."
until wget -q -O /dev/null http://localhost:3000/login 2>/dev/null; do
  sleep 3
done

echo "[warmup] Server ready. Pre-warming routes in background..."

(
  # Primary routes - most likely to be visited first
  for route in /login /tournaments /rankings /players /; do
    wget -q -O /dev/null "http://localhost:3000${route}" 2>/dev/null &
  done
  wait

  # Secondary routes
  for route in /register /forgot-password /dashboard /myprofile /news /info; do
    wget -q -O /dev/null "http://localhost:3000${route}" 2>/dev/null &
  done
  wait

  echo "[warmup] All routes pre-warmed."
) &

wait $NEXT_PID
