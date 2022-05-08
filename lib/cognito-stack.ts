// CDK
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

// Types
import { CDKContext } from '../lambda-layer/types';

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  constructor(scope: Construct, id: string, props: StackProps, context: CDKContext) {
    super(scope, id, props);

    // Cognito Pool
    const userPool = new UserPool(this, 'userPool', {
      userPoolName: `${context.appName}-${context.environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.userPool = userPool;

    // App Client
    const userPoolClient = new UserPoolClient(this, 'userPoolClient', {
      userPool: userPool,
      userPoolClientName: `${context.appName}-client-${context.environment}`,
      authFlows: {
        userPassword: true,
      },
    });
    this.userPoolClient = userPoolClient;
  }
}
