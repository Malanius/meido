import type { AppInfo } from '@/types';

export const commonFunctionEnvironment = (
  props: AppInfo,
  serviceName: string
): { [key: string]: string } => {
  const { appName, appStage } = props;
  return {
    APP_NAME: appName,
    APP_ENV: appStage,
    POWERTOOLS_DEV: appStage === 'dev' ? 'true' : 'false',
    POWERTOOLS_LOG_LEVEL: appStage === 'prod' ? 'INFO' : 'DEBUG',
    POWERTOOLS_LOGGER_LOG_EVENT: appStage === 'prod' ? 'false' : 'true',
    POWERTOOLS_PARAMETERS_MAX_AGE:
      appStage === 'prod'
        ? `${60 * 60}` // 1 Hour
        : `${60 * 2}`, // 2 minutes
    POWERTOOLS_SERVICE_NAME: `${appName}::${appStage}::${serviceName}`,
  };
};
