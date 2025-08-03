import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport("http://127.0.0.1:3000/mcp");

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  }
);

console.log(111)

await client.connect(transport);

console.log(111)

// List prompts
// const prompts = await client.listPrompts();

// console.log(`prompts: ${prompts}`)

// List resources
// const resources = await client.listResources();

// console.log(`resources: ${resources}`)

const tools = await client.listTools()

console.log(`all tools: ${JSON.stringify(tools)}`)