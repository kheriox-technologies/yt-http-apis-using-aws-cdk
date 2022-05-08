// CDK
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import { DomainName, HttpApi, CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { ARecord, RecordTarget, HostedZone } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';

import { getLambdaDefinitions } from './lambda-config';

// Types
import { CDKContext, APIStackProps } from '../lambda-layer/types';

export class APIStack extends Stack {
  constructor(scope: Construct, id: string, props: APIStackProps, context: CDKContext) {
    super(scope, id, props);

    // Define API Authorizer
    const apiAuthorizer = new HttpLambdaAuthorizer('apiAuthorizer', props.lambdaFunctions['api-authorizer'], {
      authorizerName: `${context.appName}-http-api-authorizer-${context.environment}`,
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    // Define Custom Domain
    const apiDomain = new DomainName(this, 'apiDomain', {
      domainName: context.apiDomain,
      certificate: Certificate.fromCertificateArn(this, 'apiDomainCert', context.regionalCertArn),
    });

    // Add Route 53 entry for Api
    new ARecord(this, 'apiDNSRecord', {
      zone: HostedZone.fromHostedZoneAttributes(this, 'apiHostedZone', {
        hostedZoneId: context.hostedZoneId,
        zoneName: context.baseDomain,
      }),
      recordName: context.apiDomain,
      target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(apiDomain.regionalDomainName, apiDomain.regionalHostedZoneId)),
    });

    // Define HTTP API
    const httpApi = new HttpApi(this, 'httpApi', {
      apiName: `${context.appName}-api-${context.environment}`,
      description: `HTTP API Demo - ${context.environment}`,
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS, CorsHttpMethod.DELETE, CorsHttpMethod.PATCH],
        allowOrigins: ['*'],
      },
      defaultAuthorizer: apiAuthorizer,
      defaultDomainMapping: {
        domainName: apiDomain,
      },
    });

    // Get Lambda definitions
    const lambdaDefinitions = getLambdaDefinitions(context);

    // Loop through lambda definitions and create api routes if any
    for (const lambdaDefinition of lambdaDefinitions) {
      if (lambdaDefinition.api) {
        httpApi.addRoutes({
          path: lambdaDefinition.api.path,
          methods: lambdaDefinition.api.methods,
          integration: new HttpLambdaIntegration(`${lambdaDefinition.name}-integration`, props.lambdaFunctions[lambdaDefinition.name]),
        });
      }
    }
  }
}
