import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getActivities, putActivity } from "./src/ddbTable.js";
import { v4 as uuidv4 } from 'uuid';
import express from 'express'
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";


const port = 3000
const app = express()
app.use(express.json())

// { [sessionId: string]: StreamableHTTPServerTransport } = {};
const transports = {};

app.post('/mcp', async (req, res) => {
    // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'];
  console.log(`handling POST request with session id: ${sessionId}`)
  let transport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => uuidv4(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      enableDnsRebindingProtection: true,
      allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = setUpFinanceMcpServer()

    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
})

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  console.log(`Handling GET/DELETE request with session id: ${sessionId}`)
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  console.log(`Handling GET/DELETE request with session id: ${sessionId}`)
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(port, () => {
  console.log(`Finance MCP Server listening on port ${port}`)
});

function setUpFinanceMcpServer() {
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

  return server
}

function formatItem(item) {
  return `date: ${item.date?.S}, category: ${item.category?.S}, amount: ${item.amount?.N}, description: ${item.description?.S}`
}
