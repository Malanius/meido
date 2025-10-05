import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  paginateQuery,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DATABASE_TABLE_NAME;
if (!TABLE_NAME) {
  throw new Error('DATABASE_TABLE_NAME is not set');
}

const client = new DynamoDBClient();
const docClient = DynamoDBDocument.from(client);

export interface SubscriptionEntry {
  pk: 'journal#subscription';
  sk: string;
  channel_id?: string;
  subscribed_by?: string;
  subscribed_at: number;
}

export type SubscriptionType = 'user' | 'guild';

export const getSubscriptionEntry = async (type: SubscriptionType, id: string) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: 'journal#subscription',
      sk: `${type}#${id}`,
    },
  });

  const result = await docClient.send(command);
  if (!result.Item) {
    return undefined;
  }

  return result.Item as unknown as SubscriptionEntry;
};

export const createSubscriptionEntry = async (entry: SubscriptionEntry) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: entry,
  });

  await docClient.send(command);
};

export const deleteSubscriptionEntry = async (pk: string, sk: string) => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk },
  });

  await docClient.send(command);
};

export const getAllSubscriptions = async () => {
  const queryInput: QueryCommandInput = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'journal#subscription',
    },
  };

  const paginatorConfig = {
    client: docClient,
  };

  let items = [] as SubscriptionEntry[];
  for await (const page of paginateQuery(paginatorConfig, queryInput)) {
    items = items.concat(page.Items as SubscriptionEntry[]);
  }

  return items;
};
