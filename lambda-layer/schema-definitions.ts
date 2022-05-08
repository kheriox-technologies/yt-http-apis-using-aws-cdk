import { APIPayloadValidationResult } from '/opt/types';
import Ajv from 'ajv';

// Validate API Schema
export const validateAPISchema = async (schema: any, data: any) => {
  return new Promise<APIPayloadValidationResult>(async (resolve, reject) => {
    try {
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);
      const isValid = validate(data);

      if (isValid) {
        resolve({ isValid: true });
      } else {
        resolve({
          isValid: false,
          errors: validate.errors?.map((e) => e.message),
        });
      }
    } catch (error) {
      console.log(error);
      resolve({ isValid: false, errors: ['Error occurred while validating API payload'] });
    }
  });
};

// Common Get Schema
const commonGetParams = {
  returnAttributes: { type: 'string', minLength: 1 },
  nextToken: { type: 'string' },
  limit: { type: 'number', minimum: 1 },
};

// Get Users Schema
export const getUsersSchema = {
  type: 'object',
  properties: {
    ...commonGetParams,
    email: { type: 'string', minLength: 1 },
  },
  required: [],
  additionalProperties: false,
};

// Add User Schema
export const addUserSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 1 },
    gender: { type: 'string', minLength: 1 },
    jobTitle: { type: 'string', minLength: 1 },
    country: { type: 'string', minLength: 1 },
  },
  required: ['firstName', 'lastName', 'email', 'gender', 'jobTitle', 'country'],
  additionalProperties: false,
};

// Delete User Schema
export const deleteUserSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', minLength: 1 },
  },
  required: ['email'],
  additionalProperties: false,
};

// Update User Schema
export const updateUserSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 1 },
    gender: { type: 'string', minLength: 1 },
    jobTitle: { type: 'string', minLength: 1 },
    country: { type: 'string', minLength: 1 },
  },
  required: ['email'],
  additionalProperties: false,
};
