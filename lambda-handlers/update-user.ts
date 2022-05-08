import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as utils from '/opt/utils';
import { updateUserSchema, validateAPISchema } from '/opt/schema-definitions';
import { UpdateUserBody, User } from '/opt/types';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      // Fetch Body from event
      const body: UpdateUserBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
      const validationResult = await validateAPISchema(updateUserSchema, body);

      if (validationResult.isValid) {
        //  Get DDB DocClient
        const ddbDocClient = await utils.getDDBDocClient();

        // Check if user is present in DDB
        const getUserOutput = await ddbDocClient.send(
          new QueryCommand({
            TableName: process.env.DDB_TABLE,
            KeyConditionExpression: `email = :email`,
            ExpressionAttributeValues: {
              ':email': body.email,
            },
            ProjectionExpression: 'email',
          })
        );

        // Update Item to DDB
        if (getUserOutput.Items && getUserOutput.Items.length > 0) {
          // Update attributes of User
          const updatedUser = getUserOutput.Items[0] as User;

          if (body.firstName) updatedUser.firstName = body.firstName;
          if (body.lastName) updatedUser.lastName = body.lastName;
          if (body.email) updatedUser.email = body.email;
          if (body.gender) updatedUser.gender = body.gender;
          if (body.jobTitle) updatedUser.jobTitle = body.jobTitle;
          if (body.country) updatedUser.country = body.country;
          if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, updatedUser);

          return resolve(await utils.apiSuccessResponse({ message: 'User updated successfully' }));
        } else {
          return resolve(await utils.apiErrorResponse(400, `User with email ${body.email} not found`));
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
