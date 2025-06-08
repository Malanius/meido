import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

const tracer = new Tracer();
const logger = new Logger();
const processor = new BatchProcessor(EventType.DynamoDBStreams);

const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
  logger.info('Processing record', { record });
  // TODO: Implement record processing
};

const lambdaHandler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
