import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const server = new McpServer({
  name: "financeApp",
  version: "1.0.0",
})

const ddbClient = new DynamoDBClient({})

server.registerTool("get all activities", {
  title: "Get Activities Tool",
  description: "For given start and end date, return the list of activities",
  inputSchema: { startDate: z.string(), endDate: z.string() },
}, ({startDate, endDate}) => {
  return {
    content: [{
      type: "text",
      text: "activity_date: 2025-06-20, amount: $30, description: Loblaws superstore",
    },{
      type: "text",
      text: "activity_date: 2025-06-10, amount: $4, description: paybyphone parking",
    },{
      type: "text",
      text: "activity_date: 2025-05-29, amount: $13.13, description: Netflix",
    },{
      type: "text",
      text: "activity_date: 2025-05-01, amount: $20, description: Loblaws superstore",
    }]
  }
})

const transport = new StdioServerTransport();
await server.connect(transport);