#!/bin/bash
export PATH="/nix/store/*/bin:$PATH"
PYTHON_CMD=""
for p in /nix/store/*/bin/python*; do
    if [ -x "$p" ] && [[ "$p" == *"python3"* ]]; then
        PYTHON_CMD="$p"
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    for p in /nix/store/*/bin/python*; do
        if [ -x "$p" ]; then
            PYTHON_CMD="$p"
            break
        fi
    done
fi

if [ -n "$PYTHON_CMD" ]; then
    echo "Starting AVA CORE with $PYTHON_CMD"
    $PYTHON_CMD app.py
else
    echo "Python not found"
    exit 1
fi
