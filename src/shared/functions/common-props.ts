import {
  Architecture,
  type FunctionOptions,
  LambdaInsightsVersion,
  LoggingFormat,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';

export const commonFunctionProps: FunctionOptions = {
  architecture: Architecture.ARM_64,
  loggingFormat: LoggingFormat.TEXT,
  insightsVersion: LambdaInsightsVersion.VERSION_1_0_333_0,
  tracing: Tracing.ACTIVE, // Note: disable along with POWERTOOLS_TRACE_ENABLED in common-env.ts
};
