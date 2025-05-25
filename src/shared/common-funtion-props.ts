import {
  Architecture,
  type FunctionOptions,
  LambdaInsightsVersion,
  LoggingFormat,
  SystemLogLevel,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export const commonFunctionProps: FunctionOptions = {
  architecture: Architecture.ARM_64,
  memorySize: 128,
  logRetention: RetentionDays.TWO_WEEKS,
  loggingFormat: LoggingFormat.TEXT,
  insightsVersion: LambdaInsightsVersion.VERSION_1_0_333_0,
  tracing: Tracing.ACTIVE,
};
