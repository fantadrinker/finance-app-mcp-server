import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const server = new McpServer({
  name: "financeApp",
  version: "1.0.0",
})

const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)
const TABLE_NAME = process.env.DDB_TABLE_NAME
const USER = process.env.USER_ID

console.log(111, TABLE_NAME, USER)

server.registerTool("get all activities", {
  title: "Get Activities Tool",
  description: "For given start and end date, return the list of activities",
  inputSchema: { startDate: z.string(), endDate: z.string() },
}, async ({startDate, endDate}) => {

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#ddbUser = :user AND sk between :start_date and :end_date',
    ExpressionAttributeValues: {
      ':user': USER,
      ':start_date': startDate,
      ':end_date': endDate
    },
    ExpressionAttributeNames: {
      '#ddbUser': 'user'
    }
  })

  const response = await docClient.send(command)
  
  return {
    content: (response.Items ?? []).map((item) => {
      return {
        type: "text",
        text: formatItem(item)
      }
    })
  }
})

function formatItem(item) {
  return `date: ${item.date}, category: ${item.category}, amount: ${item.amount}, description: ${item.description}`
}

const transport = new StdioServerTransport();
await server.connect(transport);