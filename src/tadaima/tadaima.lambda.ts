import { DiscordApiClient } from '@/shared/discord-api-client';
import type { MeidoInteraction } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import type { EventBridgeEvent } from 'aws-lambda';

const tracer = new Tracer();
const logger = new Logger();

const lambdaHandler = async (event: EventBridgeEvent<'tadaima', MeidoInteraction>) => {
  const { application_id, guild_id, token } = event.detail.command;
  const discordApiClient = new DiscordApiClient(application_id, guild_id, token);

  const eventTimestamp = new Date(event.time);
  const now = new Date();
  const diff = now.getTime() - eventTimestamp.getTime();
  const diffInSeconds = diff / 1000;

  await discordApiClient.sendFollowupMessage(token, `🏓 Pong! Serverless took ~${diffInSeconds}s to respond.`);
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
