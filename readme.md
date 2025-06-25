# Finance-app-server

This is an MCP server for finance app.

## Usage with Ollama

- install [mcphost](https://github.com/mark3labs/mcphost)

- Add a `local.json` file to somewhere in your filesystem following instructions on https://github.com/mark3labs/mcphost

- install ollama and a model that is compatible with tools/function calls

- run mcphost with ollama with `mcphost -m ollama:<model-name> --config <path-to-local.json>`
