#!/bin/bash

# Usage: ./start_local_ng_serve.sh [dev1|dev2]
# dev1: runs on port 4201
# dev2: runs on port 4202 and connects to dev2 backend (port 8082)

ENV=${1:-local}

case $ENV in
  dev1)
    echo "Starting Angular dev server for dev1 environment on port 4201..."
    ng serve -c local --port 4201 --disable-host-check
    ;;
  dev2)
    echo "Starting Angular dev server for dev2 environment on port 4202..."
    echo "Connecting to backend API at http://localhost:8082"
    ng serve -c dev2 --port 4202 --disable-host-check
    ;;
  *)
    echo "Starting Angular dev server for local environment on port 4200..."
    ng serve -c local --disable-host-check
    ;;
esac