import type { AttributeValue } from 'aws-lambda';

export interface DynamoEvent {
  newImage?: Record<string, AttributeValue>;
  oldImage?: Record<string, AttributeValue>;
}
