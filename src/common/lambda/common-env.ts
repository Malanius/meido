import type { AppInfo } from '@/common/app-info';

export const commonFunctionEnvironment = (props: AppInfo, serviceName: string): { [key: string]: string } => {
  const { appName, appEnv } = props;
  return {
    APP_NAME: appName,
    APP_ENV: appEnv,
    POWERTOOLS_DEV: appEnv === 'dev' ? 'true' : 'false',
    POWERTOOLS_LOG_LEVEL: appEnv === 'prod' ? 'INFO' : 'DEBUG',
    POWERTOOLS_LOGGER_LOG_EVENT: appEnv === 'prod' ? 'false' : 'true',
    POWERTOOLS_PARAMETERS_MAX_AGE:
      appEnv === 'prod'
        ? `${60 * 60}` // 1 Hour
        : `${60 * 2}`, // 2 minutes
    POWERTOOLS_SERVICE_NAME: `${appName}::${appEnv}::${serviceName}`,
    POWERTOOLS_TRACE_ENABLED: 'true', // Note: disable along with tracing: Tracing.Disabled in common-props.ts
  };
};
