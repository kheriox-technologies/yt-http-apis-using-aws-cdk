import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as utils from '/opt/utils';
import { deleteUserSchema, validateAPISchema } from '/opt/schema-definitions';
import { DeleteUserParams, User } from '/opt/types';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      // Fetch Body from event
      const params: DeleteUserParams = event.queryStringParameters ? event.queryStringParameters : {};

      // Validate Payload
      const validationResult = await validateAPISchema(deleteUserSchema, params);

      if (validationResult.isValid) {
        //  Get DDB DocClient
        const ddbDocClient = await utils.getDDBDocClient();

        // Check if user is present in DDB
        const getUserOutput = await ddbDocClient.send(
          new QueryCommand({
            TableName: process.env.DDB_TABLE,
            KeyConditionExpression: `email = :email`,
            ExpressionAttributeValues: {
              ':email': params.email,
            },
            ProjectionExpression: 'email',
          })
        );

        // Delete Item to DDB
        if (getUserOutput.Items && getUserOutput.Items.length > 0) {
          if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, params.email);
          return resolve(await utils.apiSuccessResponse({ message: 'User deleted successfully' }));
        } else {
          return resolve(await utils.apiErrorResponse(400, `User with email ${params.email} not found`));
        }
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
