import { env } from 'node:process';
import type { DiscordSecret } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { APIGatewayProxyEventHeaders, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { type APIInteraction, InteractionType } from 'discord-api-types/v10';
import * as nacl from 'tweetnacl';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set');
}

const isValidSignature = (publicKey: string, headers: APIGatewayProxyEventHeaders, rawBody?: string) => {
  const signature = headers['x-signature-ed25519'];
  const timestamp = headers['x-signature-timestamp'];

  if (!signature || !timestamp) {
    logger.debug('Missing signature or timestamp');
    return false;
  }

  return nacl.sign.detached.verify(
    new Uint8Array(Buffer.from(timestamp + rawBody)),
    new Uint8Array(Buffer.from(signature, 'hex')),
    new Uint8Array(Buffer.from(publicKey, 'hex'))
  );
};

const response = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 => ({
  statusCode,
  body: JSON.stringify(body),
  isBase64Encoded: false,
});

const lambdaHandler = async (event: APIGatewayProxyEventV2) => {
  if (event.requestContext.http.method !== 'POST') {
    return response(405, { error: 'Method Not Allowed' });
  }

  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;
  const publicKey = discordSecret?.publicKey;
  const headers = event.headers;

  if (!isValidSignature(publicKey, headers, event.body)) {
    logger.debug('Invalid request signature');
    return response(401, { error: 'invalid request signature' });
  }

  const body: APIInteraction = JSON.parse(event.body || '{}');
  if (!body) {
    logger.debug('Invalid request body');
    return response(400, { error: 'Invalid request body' });
  }

  if (body.type === InteractionType.Ping) {
    logger.debug('Received a PING interaction');
    return response(200, { type: InteractionType.Ping });
  }

  // TODO: Handle other interaction types
  return response(501, { error: 'Not Implemented' });
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
