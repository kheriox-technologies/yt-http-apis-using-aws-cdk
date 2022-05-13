import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as utils from '/opt/utils';
import { addUserSchema, validateAPISchema } from '/opt/schema-definitions';
import { AddUserBody, User } from '/opt/types';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      // Fetch Body from event
      const body: AddUserBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
      const validationResult = await validateAPISchema(addUserSchema, body);

      if (validationResult.isValid) {
        // Build User DDB Item
        const user: User = {
          itemType: 'User',
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          gender: body.gender,
          jobTitle: body.jobTitle,
          country: body.country,
        };

        // Write Item to DDB
        if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, user);

        // Return success message
        return resolve(await utils.apiSuccessResponse({ message: 'User added successfully' }));
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
