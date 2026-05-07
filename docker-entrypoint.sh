#!/bin/sh
set -e

./server migrate up

exec ./server "$@"
