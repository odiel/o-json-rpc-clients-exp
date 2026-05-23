import type { JSONSchema } from '@o-json-rpc/o-json-rpc-ts';
import { fromFileUrl, dirname } from "@std/path";

export function schemaToTypescript(schema: JSONSchema, name = 'Root'): string {
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
            return schema.enum.map((e) => `'${e}'`).join(' | ');
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
                    name + 'Item',
                );
                return `${itemType}[]`;
            }

            if ('anyOf' in schema.items && schema.items.anyOf !== undefined) {
                return schema.items.anyOf.map((e) => `${schemaToTypescript(e)}[]`).join(' | ');
            }
        }
    }

    if (schema.type === 'object') {
        const props = schema.properties || {};
        const required = new Set(schema.required || []);

        const fields: string[] = [];

        for (const propertyName of Object.keys(props)) {
            const propertyBody = props[propertyName];
            if (typeof propertyBody == 'object') {
                const tsType = schemaToTypescript(propertyBody, propertyName);
                const optional = required.has(propertyName) ? '' : '?';
                fields.push(`${propertyName}${optional}: ${tsType};`);
            }
        }

        return `{ ${fields.join(' ')} }`;
    }

    if (schema.anyOf) {
        return schema.anyOf.map((e) => schemaToTypescript(e)).join(' | ');
    }

    // if (schema.allOf) {}

    // if (schema.anyOf) {}

    return 'unknown';
}

export async function fetchCommonFileContent(): Promise<string> {
    const url = new URL("./templates/common.ts", import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to load ${url.toString()} content.`);
    }

    return await response.text();
}

export async function fetchIndexFileContent(): Promise<string> {
    const url = new URL("./templates/api_index.ts", import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to load ${url.toString()} content.`);
    }

    return await response.text();
}

export async function fetchHTTPClientFileContent(): Promise<string> {
    const url = new URL("./templates/api_http_client.ts", import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to load ${url.toString()} content.`);
    }

    return await response.text();
}

export async function fetchWSClientFileContent(): Promise<string> {
    const url = new URL("./templates/api_ws_client.ts", import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to load ${url.toString()} content.`);
    }

    return await response.text();
}
