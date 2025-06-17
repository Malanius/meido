import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DATABASE_TABLE_NAME;
if (!TABLE_NAME) {
  throw new Error('DATABASE_TABLE_NAME is not set');
}

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export interface SubscriptionEntry {
  pk: 'journal#subscription';
  sk: string;
  channel_id: string;
  subscribed_by: string;
  subscribed_at: number;
}

export const getSubscriptionEntry = async (type: 'user' | 'guild', id: string) => {
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
