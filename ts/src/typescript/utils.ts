import type { JSONSchema } from '@o-json-rpc/o-json-rpc-ts';
import { fetchTextFileContent } from '../utils.ts';

export function schemaToTypescript(schema: JSONSchema, name: string, dept: number, enums: string[]): string {
    if (schema.type === 'null') {
        return 'null';
    }

    if (schema.type === 'boolean') {
        return 'boolean';
    }

    if (schema.type === 'number' || schema.type === 'integer') {
        return 'number';
    }

    if (schema.type === 'string') {
        if (schema.enum) {
            const values = schema.enum.map((e: unknown) => `'${e}'`).join(' | ');
            enums.push(`export type ${name} = ${values};`);
            return name;
        }

        if (schema.const) {
            return `'${schema.const.toString()}'`;
        }

        return 'string';
    }

    if (schema.type === 'array' && schema.items) {
        if (typeof schema.items == 'object') {
            if ('type' in schema.items) {
                const itemType = schemaToTypescript(
                    schema.items || {},
                    name,
                    dept,
                    enums,
                );
                return `${itemType}[]`;
            }

            if ('anyOf' in schema.items && schema.items.anyOf !== undefined) {
                return schema.items.anyOf.map((e: JSONSchema) => `${schemaToTypescript(e, name, dept, enums)}[]`).join(' | ');
            }
        }
    }

    if (schema.type === 'object') {
        const props = schema.properties || {};
        const required = new Set(schema.required || []);

        const fields: string[] = [];
        const tabPad = '    '.repeat(dept + 1);

        for (const propertyName of Object.keys(props)) {
            const propertyBody = props[propertyName];
            if (typeof propertyBody == 'object') {
                const tsType = schemaToTypescript(propertyBody, `${name}_${propertyName}`, dept + 1, enums);
                const optional = required.has(propertyName) ? '' : '?';
                fields.push(`${tabPad}${propertyName}${optional}: ${tsType};`);
            }
        }

        if (fields.length === 0) {
            return 'unknown';
        }

        return `{\n${fields.join('\n')}\n${dept > 0 ? '    '.repeat(dept) : ''}}`;
    }

    if (schema.anyOf) {
        return schema.anyOf.map((e: JSONSchema) => schemaToTypescript(e, name, dept + 1, enums)).join(' | ');
    }

    // if (schema.allOf) {}

    // if (schema.anyOf) {}

    return 'unknown';
}

export async function fetchTemplateCommon(): Promise<string> {
    const url = new URL('../../templates/typescript/common.ts', import.meta.url);
    return await fetchTextFileContent(url);
}

export async function fetchTemplateAPIIndex(): Promise<string> {
    const url = new URL('../../templates/typescript/api_index.ts', import.meta.url);
    return await fetchTextFileContent(url);
}

export async function fetchTemplateHTTPClient(): Promise<string> {
    const url = new URL('../../templates/typescript/api_http_client.ts', import.meta.url);
    return await fetchTextFileContent(url);
}

export async function fetchTemplateWSClient(): Promise<string> {
    const url = new URL('../../templates/typescript/api_ws_client.ts', import.meta.url);
    return await fetchTextFileContent(url);
}
