import { StackProps } from 'aws-cdk-lib';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { HttpMethod } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export type CDKContext = {
  appName: string;
  region: string;
  environment: string;
  branchName: string;
  accountNumber: string;
  baseDomain: string;
  apiDomain: string;
  hostedZoneId: string;
  regionalCertArn: string;
};

export type LambdaDefinition = {
  name: string;
  memoryMB?: number;
  timeoutMins?: number;
  environment?: {
    [key: string]: string;
  };
  api?: {
    path: string;
    methods: HttpMethod[];
  };
};

export type APIPayloadValidationResult = {
  isValid: boolean;
  errors?: (string | undefined)[];
};

export type User = {
  itemType: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  jobTitle: string;
  country: string;
};

// User API Type Definitions
export type GetUsersParams = {
  returnAttributes?: string;
  nextToken?: string;
  limit?: number;
  email?: string;
};
export type AddUserBody = {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  jobTitle: string;
  country: string;
};
export type UpdateUserBody = {
  email: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  jobTitle?: string;
  country?: string;
};
export type DeleteUserParams = {
  email?: string;
};

export type APIAuthorizerEvent = {
  headers: {
    authorization: string;
  };
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
};
export type APIAuthValidationResult = {
  isAuthorized: boolean;
};

export interface LambdaStackProps extends StackProps {
  userPool: UserPool;
  ddbTable: Table;
}

export interface APIStackProps extends StackProps {
  lambdaFunctions: {
    [key: string]: NodejsFunction;
  };
}
