#!/bin/bash

# Usage:
# test-prompt prompt_file

mcphost -m ollama:qwen3:1.7b --config local.json -p "$(cat $1)" --quiet