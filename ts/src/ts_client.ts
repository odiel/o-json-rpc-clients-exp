import { copy, ensureDir, exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';
import { generateHttpClient, generateResources, generateWSClient } from './generators/index.ts';

export async function generateTSClient(
    definition: APIDefinition,
    path: string,
) {
    for (const [api, apiDefinition] of Object.entries(definition.apis)) {
        const apiSlug = api.replaceAll('\\', '_').replaceAll('/', '_');
        const apiPath = `${path}/${apiSlug}`;

        if (!(await exists(apiPath, { isDirectory: true }))) {
            await ensureDir(apiPath);
        }

        await copy(`./templates/common.ts`, `${apiPath}/common.ts`, { overwrite: true });

        await generateResources(apiPath, apiDefinition.resources);
        await copy(`./templates/api_index.ts`, `${apiPath}/index.ts`, { overwrite: true });

        await generateHttpClient(api, apiPath, apiDefinition.procedures);
        await generateWSClient(api, apiPath, apiDefinition.procedures);
    }
}
