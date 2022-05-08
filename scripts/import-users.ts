import { readJSONSync } from 'fs-extra';
import { User } from '../lambda-layer/types';
import { ddbBatchWrite } from '../lambda-layer/utils';

const main = async () => {
  try {
    const users: User[] = readJSONSync('../data/sample-users.json');
    const ddbUsers = users.map((u) => {
      return { ...u, itemType: 'User' };
    });
    await ddbBatchWrite('httpApi-demo-develop', ddbUsers);
  } catch (error) {
    console.log(error);
  }
};

main();
