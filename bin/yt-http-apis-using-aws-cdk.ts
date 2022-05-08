#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { APIStack } from '../lib/api-stack';
import gitBranch from 'git-branch';
import { CDKContext } from '../lambda-layer/types';

// Get CDK Context based on git branch
export const getContext = async (app: cdk.App): Promise<CDKContext> => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentBranch = await gitBranch();

      const environment = app.node.tryGetContext('environments').find((e: any) => e.branchName === currentBranch);

      const globals = app.node.tryGetContext('globals');

      return resolve({ ...globals, ...environment });
    } catch (error) {
      console.error(error);
      return reject();
    }
  });
};

// Create Stacks
const createStacks = async () => {
  try {
    const app = new cdk.App();
    const context = await getContext(app);

    const tags: any = {
      Environment: context.environment,
    };

    const stackProps: cdk.StackProps = {
      env: {
        region: context.region,
        account: context.accountNumber,
      },
      tags,
    };

    const dynamoDBStack = new DynamoDBStack(app, `${context.appName}-dynamodb-stack-${context.environment}`, stackProps, context);
    const cognitoStack = new CognitoStack(app, `${context.appName}-cognito-stack-${context.environment}`, stackProps, context);
    const lambdaStack = new LambdaStack(
      app,
      `${context.appName}-lambda-stack-${context.environment}`,
      { ...stackProps, userPool: cognitoStack.userPool, ddbTable: dynamoDBStack.ddbTable },
      context
    );
    const apiStack = new APIStack(
      app,
      `${context.appName}-api-stack-${context.environment}`,
      { ...stackProps, lambdaFunctions: lambdaStack.lambdaFunctions },
      context
    );
  } catch (error) {
    console.error(error);
  }
};

createStacks();
