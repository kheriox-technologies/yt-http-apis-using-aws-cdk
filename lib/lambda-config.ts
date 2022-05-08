import { Duration } from 'aws-cdk-lib';
import { LambdaDefinition, CDKContext } from '../lambda-layer/types';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { HttpMethod } from 'aws-cdk-lib/aws-stepfunctions-tasks';

// Constants
const DEFAULT_LAMBDA_MEMORY_MB = 1024;
const DEFAULT_LAMBDA_TIMEOUT_MINS = 15;

// Returns lambda definitions with custom env
export const getLambdaDefinitions = (context: CDKContext, userPool?: UserPool): LambdaDefinition[] => {
  const environment = {
    DDB_TABLE: `${context.appName}-${context.environment}`,
  };
  const lambdaDefinitions: LambdaDefinition[] = [
    {
      name: 'get-users',
      environment,
      api: {
        path: '/users',
        methods: [HttpMethod.GET],
      },
    },
    {
      name: 'add-user',
      environment,
      api: {
        path: '/users',
        methods: [HttpMethod.POST],
      },
    },
    {
      name: 'delete-user',
      environment,
      api: {
        path: '/users',
        methods: [HttpMethod.DELETE],
      },
    },
    {
      name: 'update-user',
      environment,
      api: {
        path: '/users',
        methods: [HttpMethod.PATCH],
      },
    },
    {
      name: 'api-authorizer',
      environment: { ...environment, USER_POOL_ID: userPool ? userPool.userPoolId : 'UNKNOWN' },
    },
  ];
  return lambdaDefinitions;
};

// Returns Lambda Function properties with defaults and overwrites
export const getFunctionProps = (
  lambdaDefinition: LambdaDefinition,
  lambdaRole: iam.Role,
  lambdaLayer: lambda.LayerVersion,
  context: CDKContext
): NodejsFunctionProps => {
  const functionProps: NodejsFunctionProps = {
    functionName: `${context.appName}-${lambdaDefinition.name}-${context.environment}`,
    entry: `lambda-handlers/${lambdaDefinition.name}.ts`,
    runtime: lambda.Runtime.NODEJS_14_X,
    memorySize: lambdaDefinition.memoryMB ? lambdaDefinition.memoryMB : DEFAULT_LAMBDA_MEMORY_MB,
    timeout: lambdaDefinition.timeoutMins ? Duration.minutes(lambdaDefinition.timeoutMins) : Duration.minutes(DEFAULT_LAMBDA_TIMEOUT_MINS),
    environment: lambdaDefinition.environment,
    role: lambdaRole,
    layers: [lambdaLayer],
  };
  return functionProps;
};
