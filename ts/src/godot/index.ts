import { ensureDir, exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';
import { generateHttpClient } from './generators/httpClient.ts';
import { apiSlug } from '../utils.ts';

export async function generateGodotClient(
    definition: APIDefinition,
    path: string,
    apis?: string[],
) {
    for (const [api, apiDefinition] of Object.entries(definition.apis)) {
        if (apis && apis.length > 0 && !apis.includes(api)) {
            continue;
        }

        const apiPath = `${path}/${apiSlug(api)}`;

        if (!(await exists(apiPath, { isDirectory: true }))) {
            await ensureDir(apiPath);
        }

        await generateHttpClient(api, apiPath, apiDefinition.procedures);
    }
}
