import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as utils from '/opt/utils';
import { getUsersSchema, validateAPISchema } from '/opt/schema-definitions';
import { GetUsersParams } from '/opt/types';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import _ from 'lodash';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      // Fetch Params from event
      const params: GetUsersParams = event.queryStringParameters ? event.queryStringParameters : {};
      if (params.limit) params.limit = Number(params.limit);

      // Validate Payload
      const validationResult = await validateAPISchema(getUsersSchema, params);

      if (validationResult.isValid) {
        //  Get DDB DocClient
        const ddbDocClient = await utils.getDDBDocClient();

        // Query command input with attributes to get
        const queryCommandInput: QueryCommandInput = {
          TableName: process.env.DDB_TABLE,
          ExclusiveStartKey: params.nextToken ? JSON.parse(Buffer.from(params.nextToken, 'base64').toString('ascii')) : undefined,
          ProjectionExpression: params.returnAttributes ? params.returnAttributes : undefined,
          Limit: params.limit ? params.limit : undefined,
          ExpressionAttributeValues: {},
        };

        // Add Query Expression
        if (params.email) {
          queryCommandInput.KeyConditionExpression = 'email = :email';
          queryCommandInput.ExpressionAttributeValues = {
            ...queryCommandInput.ExpressionAttributeValues,
            ':email': params.email,
          };
        } else {
          queryCommandInput.IndexName = 'itemType-index';
          queryCommandInput.KeyConditionExpression = 'itemType = :itemType';
          queryCommandInput.ExpressionAttributeValues = {
            ...queryCommandInput.ExpressionAttributeValues,
            ':itemType': 'User',
          };
        }

        // Execute Query
        const queryCommandOutput = await ddbDocClient.send(new QueryCommand(queryCommandInput));

        // Return Response
        return resolve(
          await utils.apiSuccessResponse({
            data: queryCommandOutput.Items ? _.orderBy(queryCommandOutput.Items, 'firstName', 'asc') : [],
            nextToken: queryCommandOutput.LastEvaluatedKey
              ? Buffer.from(JSON.stringify(queryCommandOutput.LastEvaluatedKey)).toString('base64')
              : '',
          })
        );
      } else {
        // Return validation errors
        return resolve(await utils.apiErrorResponse(400, validationResult.errors?.join(',')));
      }
    } catch (error: any) {
      utils.logError(error);
      resolve(await utils.apiErrorResponse(500, error.message || error));
    }
  });
};
