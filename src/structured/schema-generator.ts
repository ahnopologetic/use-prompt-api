/**
 * Schema generation utilities for structured output
 */

import type { ZodType } from 'zod';
import type { SchemaDefinition } from '../types';

export function generateSchema<T>(zodSchema: ZodType<T>): SchemaDefinition {
  // This is a simplified schema generator
  // In production, you'd use a library like zod-to-json-schema
  const schema = zodSchemaToJsonSchema(zodSchema);
  return schema;
}

function zodSchemaToJsonSchema(zodSchema: ZodType): SchemaDefinition {
  // Access the internal _def property to get schema information
  const def = (zodSchema as unknown as { _def: { typeName: string } })._def;

  switch (def.typeName) {
    case 'ZodString':
      return { type: 'string' };

    case 'ZodNumber':
      return { type: 'number' };

    case 'ZodBoolean':
      return { type: 'boolean' };

    case 'ZodArray': {
      const arrayDef = def as unknown as { type: ZodType };
      return {
        type: 'array',
        items: zodSchemaToJsonSchema(arrayDef.type),
      };
    }

    case 'ZodObject': {
      const objectDef = def as unknown as {
        shape: () => Record<string, ZodType>;
      };
      const shape = objectDef.shape();
      const properties: Record<string, SchemaDefinition> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodSchemaToJsonSchema(value);
        
        // Check if optional
        const valueDef = (value as unknown as { _def: { typeName: string } })._def;
        if (valueDef.typeName !== 'ZodOptional') {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    case 'ZodEnum': {
      const enumDef = def as unknown as { values: string[] };
      return {
        type: 'string',
        enum: enumDef.values,
      };
    }

    case 'ZodOptional': {
      const optionalDef = def as unknown as { innerType: ZodType };
      return zodSchemaToJsonSchema(optionalDef.innerType);
    }

    case 'ZodNullable': {
      const nullableDef = def as unknown as { innerType: ZodType };
      return zodSchemaToJsonSchema(nullableDef.innerType);
    }

    case 'ZodUnion': {
      const unionDef = def as unknown as { options: ZodType[] };
      // For simplicity, return the first option's schema
      // In production, you'd want to handle this more sophisticatedly
      return zodSchemaToJsonSchema(unionDef.options[0]!);
    }

    default:
      console.warn(`Unsupported Zod type: ${def.typeName}`);
      return { type: 'string' };
  }
}

export function schemaToString(schema: SchemaDefinition, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (schema.type === 'object' && schema.properties) {
    const props = Object.entries(schema.properties)
      .map(([key, value]) => {
        const required = schema.required?.includes(key) ? '' : '?';
        return `${spaces}  ${key}${required}: ${schemaToString(value, indent + 1)}`;
      })
      .join('\n');
    
    return `{\n${props}\n${spaces}}`;
  }
  
  if (schema.type === 'array' && schema.items) {
    return `Array<${schemaToString(schema.items, indent)}>`;
  }
  
  if (schema.enum) {
    return schema.enum.map(v => `"${v}"`).join(' | ');
  }
  
  return schema.type;
}

export function createSchemaPrompt(schema: SchemaDefinition): string {
  return `You must respond with valid JSON matching this exact schema:
${JSON.stringify(schema, null, 2)}

Rules:
- Respond ONLY with the JSON object, no additional text
- Ensure all required fields are present
- Follow the exact structure and types specified
- Do not include any markdown formatting or code blocks`;
}

