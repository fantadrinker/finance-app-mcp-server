import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getActivities, postActivities, putActivity } from "./src/ddbTable.js";


const server = new McpServer({
  name: "financeApp",
  version: "1.0.0",
})

server.registerTool("get all activities", {
  title: "Get Activities Tool",
  description: "For given start and end date, return the list of activities",
  inputSchema: { startDate: z.string(), endDate: z.string() },
}, async ({startDate, endDate}) => {

  try {
    const items = await getActivities({
      startDate,
      endDate,
    })
    return {
      content: items.map((item) => {
        return {
          type: "text",
          text: formatItem(item)
        }
      })
    }
  } catch (e) {
    return {
      content: [{
        type: "text",
        text: e.stack
      }]
    }
  }
  
})

server.registerTool("Record Activities tool", {
  title: "Record Activities Tool",
  description: "Record activities in json for future use",
  inputSchema: {
    activities: z.array(z.object({
      date: z.string(),
      category: z.string(),
      amount: z.number(),
      description: z.string(),
    }))
  }
}, async ({activities}) => {
  try {
    // await postActivities(activities)
    await Promise.all(activities.map(putActivity))
  } catch (e) {
    return {
      content: [
        {
          type: "text",
          text: `error: ${e.stack}`
        }
      ]
    }
  }

  return {
    content: [
      {
        type: "text",
        text: "success"
      }
    ]
  }
})

function formatItem(item) {
  return `date: ${item.date?.S}, category: ${item.category?.S}, amount: ${item.amount?.N}, description: ${item.description?.S}`
}

const transport = new StdioServerTransport();
await server.connect(transport);