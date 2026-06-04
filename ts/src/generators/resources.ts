import type { JSONSchema, ResourceName } from '@o-json-rpc/o-json-rpc-ts';
import { schemaToTypescript } from '../utils.ts';

export async function generateResources(apiPath: string, resources: Record<ResourceName, JSONSchema>) {
    let resourceCode = '';

    for (const [resourceName, jsonSchema] of Object.entries(resources)) {
        const resourceSchema = schemaToTypescript(jsonSchema);
        resourceCode += `\nexport type ${resourceName} = ${resourceSchema};\n`;
    }

    await Deno.writeTextFile(`${apiPath}/resources.ts`, resourceCode);
}
