import { DynamoDBDocumentClient, BatchWriteCommand, BatchWriteCommandInput, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import _ from 'lodash';
import { APIGatewayProxyResultV2 } from 'aws-lambda';

// Logger Functions
export const logInfo = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.info(`${title}: ${message}`) : console.info(message);
  } else {
    title ? console.info(`${title}:`, JSON.stringify(message, null, 2)) : console.info(JSON.stringify(message, null, 2));
  }
};
export const logError = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.error(`${title}: ${message}`) : console.error(message);
  } else {
    title ? console.error(`${title}:`, JSON.stringify(message, null, 2)) : console.error(JSON.stringify(message, null, 2));
  }
};
export const logWarn = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.warn(`${title}: ${message}`) : console.warn(message);
  } else {
    title ? console.warn(`${title}:`, JSON.stringify(message, null, 2)) : console.warn(JSON.stringify(message, null, 2));
  }
};
export const logDebug = (message: string | any, title: string | undefined = undefined): void => {
  if (process.env.LOG_LEVEL === 'debug') {
    if (typeof message === 'string') {
      title ? console.debug(`${title}: ${message}`) : console.debug(message);
    } else {
      title ? console.debug(`${title}:`, JSON.stringify(message, null, 2)) : console.debug(JSON.stringify(message, null, 2));
    }
  }
};

// Get API Success response
export const apiSuccessResponse = (body: any) => {
  return new Promise<APIGatewayProxyResultV2>((resolve, reject) => {
    resolve({
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: typeof body === 'string' ? JSON.stringify({ message: body }) : JSON.stringify(body),
    });
  });
};

// Get API Error response
export const apiErrorResponse = (statusCode: number, error: string = 'Something went wrong. Please contact administrator') => {
  return new Promise<APIGatewayProxyResultV2>((resolve, reject) => {
    resolve({
      statusCode: statusCode,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ error }),
    });
  });
};

// Get Document Client
export const getDDBDocClient = (): Promise<DynamoDBDocumentClient> => {
  return new Promise((resolve, reject) => {
    const ddbClient = new DynamoDBClient({ region: 'ap-southeast-2' });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);
    resolve(ddbDocClient);
  });
};

// DDB Batch Write
export const ddbBatchWrite = (table: string, items: any[]): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    console.info(`Batch Writing ${items.length} items`);
    const ddbDocClient = await getDDBDocClient();

    const putRequests = items.map((i) => {
      return {
        PutRequest: {
          Item: i,
        },
      };
    });

    const batchChunks = _.chunk(putRequests, 25);
    for (const [i, chunk] of batchChunks.entries()) {
      const batchWriteInput: BatchWriteCommandInput = {
        RequestItems: {},
      };
      if (batchWriteInput.RequestItems) {
        batchWriteInput.RequestItems[table] = chunk;
        try {
          const batchWriteCommand = new BatchWriteCommand(batchWriteInput);
          await ddbDocClient.send(batchWriteCommand);
        } catch (err) {
          console.log(err);
        }
      }
    }
    resolve();
  });
};

// DDb Write Item
export const ddbWrite = (table: string, item: any): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('Writing item to DDB');
      const ddbDocClient = await getDDBDocClient();

      await ddbDocClient.send(new PutCommand({ TableName: table, Item: item }));

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// DDb Delete Item
export const ddbDelete = (table: string, email: string): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('Deleting item from DDB');
      const ddbDocClient = await getDDBDocClient();

      await ddbDocClient.send(new DeleteCommand({ TableName: table, Key: { email } }));

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
