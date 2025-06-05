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

const JP_PROBABILITY = 0.15;

const DICTIONARY = {
  en: {
    welcome: 'Welcome home',
    master: 'Master',
    sorry: 'Sorry',
  },
  ja: {
    welcome: 'おかえりなさい',
    master: 'ご主人様',
    sorry: 'ごめんなさい',
  },
};

const getWelcomeMessage = (isMaster: boolean) => {
  const lang = Math.random() < JP_PROBABILITY ? 'ja' : 'en';
  if (isMaster) {
    return `**${DICTIONARY[lang].welcome}**, ${DICTIONARY[lang].master}! :blush:`;
  }

  return `${DICTIONARY[lang].welcome}!`;
};

const getColdStartMessage = (endpointColdStart: boolean, handlerColdStart: boolean) => {
  const lang = Math.random() < JP_PROBABILITY ? 'ja' : 'en';
  if (endpointColdStart && handlerColdStart) {
    return `I've been very cold :cold_face:, ${DICTIONARY[lang].sorry}! :woman_bowing:`;
  }

  if (endpointColdStart || handlerColdStart) {
    return `I've been slightly cold :snowflake:, ${DICTIONARY[lang].sorry}! :woman_bowing:`;
  }

  return '';
};

let handlerColdStart = true;

const lambdaHandler = async (event: EventBridgeEvent<'tadaima', MeidoInteraction>) => {
  const { application_id, guild_id, token } = event.detail.command;
  const discordApiClient = new DiscordApiClient(application_id, guild_id, token);

  const welcomeMessage = getWelcomeMessage(event.detail.invokedByMaster);
  const coldStartMessage = getColdStartMessage(event.detail.endpointColdStart, handlerColdStart);

  const eventTimestamp = new Date(event.time);
  const now = new Date();
  const diff = now.getTime() - eventTimestamp.getTime();
  const diffInSeconds = diff / 1000;
  const timeToRespond = `It took me ~${diffInSeconds}s to respond...`;

  const message = `${welcomeMessage} ${timeToRespond} ${coldStartMessage}`;

  await discordApiClient.sendFollowupMessage(token, message);
  handlerColdStart = false;
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
