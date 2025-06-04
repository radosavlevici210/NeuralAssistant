#!/bin/bash
# AVA CORE Bootstrap Script
# Bypasses configuration issues and starts the enhanced production system

echo "AVA CORE Production Bootstrap"
echo "============================="

# Find Python interpreter
PYTHON_CMD=""

# Check common Python locations
for py in python3.11 python3.10 python3.9 python3 python; do
    if command -v $py >/dev/null 2>&1; then
        PYTHON_CMD=$py
        echo "Found Python: $PYTHON_CMD"
        break
    fi
done

# Check Nix store for Python
if [ -z "$PYTHON_CMD" ]; then
    for nixpy in /nix/store/*/bin/python3*; do
        if [ -x "$nixpy" ]; then
            PYTHON_CMD=$nixpy
            echo "Found Nix Python: $PYTHON_CMD"
            break
        fi
    done
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Python not found"
    echo "Installing Python via Nix..."
    
    # Try to add Python to PATH from Nix store
    export PATH="/nix/store/$(ls /nix/store 2>/dev/null | grep python3 | head -1)/bin:$PATH"
    
    # Re-check for Python
    for py in python3.11 python3.10 python3.9 python3 python; do
        if command -v $py >/dev/null 2>&1; then
            PYTHON_CMD=$py
            echo "Found Python after Nix update: $PYTHON_CMD"
            break
        fi
    done
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Could not find or install Python"
    exit 1
fi

# Install dependencies if pip is available
if command -v pip3 >/dev/null 2>&1; then
    echo "Installing Python dependencies..."
    pip3 install flask flask-socketio requests || echo "Dependencies may already be installed"
elif $PYTHON_CMD -m pip --version >/dev/null 2>&1; then
    echo "Installing Python dependencies..."
    $PYTHON_CMD -m pip install flask flask-socketio requests || echo "Dependencies may already be installed"
fi

# Start AVA CORE
echo "Starting AVA CORE Enhanced Production System..."
echo "Port: 5000"
echo "Interface: http://0.0.0.0:5000"
echo "=========================================="

export PYTHONPATH="${PYTHONPATH}:$(pwd)"
exec $PYTHON_CMD app.py