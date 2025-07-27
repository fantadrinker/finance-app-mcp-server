import { v4 as uuidv4 } from 'uuid';
import { BatchWriteItemCommand, DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE_NAME = process.env.DDB_TABLE_NAME
const USER = process.env.USER_ID

export async function getActivities({
  startDate,
  endDate,
}) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#ddbUser = :user AND sk between :start_date and :end_date',
    ExpressionAttributeValues: {
      ':user': {
        'S': USER
      },
      ':start_date': {
        'S': startDate
      },
      ':end_date': {
        'S': endDate
      }
    },
    ExpressionAttributeNames: {
      '#ddbUser': 'user'
    }
  })
  const response = await docClient.send(command)

  if (response.Items.length === 0) {
    console.log("0 activities found for given parameters")
  }
  return response.Items ?? []
}

export async function postActivities(activities) {
  const putRequests = activities.map((activity) => ({
    PutRequest: {
      Item: parseActivityInputToDdbSchema(activity)
    }
  }))
  const command = new BatchWriteItemCommand({
    TableName: TABLE_NAME,
    RequestItems: {
      BatchWriteActivities: putRequests
    }
  })
  const response = await docClient.send(command);

  return response
}

export async function putActivity(activity) {
  const putCommand = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: parseActivityInputToDdbSchema(activity)
  })

  const response = await docClient.send(putCommand)
  return response
}

function parseActivityInputToDdbSchema(activity) {
  return {
    user: {
      'S': USER,
    },
    sk: {
      'S': `${activity.date}#${uuidv4()}`,
    },
    date: {
      'S': activity.date
    },
    amount: {
      'N': `${activity.amount}`,
    },
    description: {
      'S': activity.description
    },
    category: {
      'S': activity.category
    }
  }
}