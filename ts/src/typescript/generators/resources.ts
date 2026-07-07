import type { JSONSchema, ResourceName } from '@o-json-rpc/o-json-rpc-ts';
import { schemaToTypescript } from '../utils.ts';

export async function generateResources(apiPath: string, resources: Record<ResourceName, JSONSchema>) {
    let resourceCode = '';

    for (const [resourceName, jsonSchema] of Object.entries(resources)) {
        const enums: string[] = [];
        const resourceSchema = schemaToTypescript(jsonSchema, resourceName, 0, enums);
        resourceCode += `${enums.length > 0 ? `\n${enums.join('\n')}` : ''}\nexport type ${resourceName} = ${resourceSchema};\n`;
    }

    await Deno.writeTextFile(`${apiPath}/resources.ts`, resourceCode);
}
