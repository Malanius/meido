import { env } from 'node:process';
import { EventsSource } from '@/shared/event-source';
import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import middy from '@middy/core';
import type { AttributeValue, DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

const tracer = new Tracer();
const logger = new Logger();
const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient());
const processor = new BatchProcessor(EventType.DynamoDBStreams);

const EVENTS_BUS_NAME = env.EVENTS_BUS_NAME;
if (!EVENTS_BUS_NAME) {
  throw new Error('EVENTS_BUS_NAME environment variable is not set');
}

interface ValidStreamRecord extends DynamoDBRecord {
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE';
  dynamodb: {
    // Key schema is quaranteed by our table definition
    Keys: {
      pk: { S: string };
      sk: { S: string };
    };
    NewImage?: Record<string, AttributeValue>;
    OldImage?: Record<string, AttributeValue>;
  };
}

type AssertValidRecord = (record: DynamoDBRecord) => asserts record is ValidStreamRecord;
const assertValidRecord: AssertValidRecord = (record) => {
  if (
    !record.eventName ||
    !record.dynamodb ||
    !record.dynamodb.Keys ||
    !record.dynamodb.Keys.pk ||
    !record.dynamodb.Keys.sk ||
    typeof record.dynamodb.Keys.pk.S !== 'string' ||
    typeof record.dynamodb.Keys.sk.S !== 'string' ||
    (!record.dynamodb.NewImage && !record.dynamodb.OldImage)
  ) {
    logger.error('Invalid DynamoDB stream record', { record });
    throw new Error('Invalid DynamoDB stream record');
  }
};

const semanticAction = {
  INSERT: 'Created',
  MODIFY: 'Updated',
  REMOVE: 'Deleted',
};

const lambdaHandler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));

const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
  logger.info('Processing record', { record });
  assertValidRecord(record);
  const action = semanticAction[record.eventName];
  const pk = record.dynamodb.Keys.pk.S;
  const [module, entity, _entityId] = pk.split('#');
  const detailType = `${module}.${entity}.${action}`;
  await sendEvent(detailType, record.dynamodb.NewImage, record.dynamodb.OldImage);
};

const sendEvent = async (
  detailType: string,
  newImage?: Record<string, AttributeValue>,
  oldImage?: Record<string, AttributeValue>
) => {
  const payload = {
    newImage,
    oldImage,
  };
  const event = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENTS_BUS_NAME,
        Source: EventsSource.Database,
        DetailType: detailType,
        Time: new Date(),
        Detail: JSON.stringify(payload),
      },
    ],
  });
  logger.debug('Sending event', { event });
  const response = await eventBridgeClient.send(event);
  logger.debug('Event sent', { response });
};
