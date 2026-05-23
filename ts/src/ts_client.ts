import { copy, ensureDir, exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';
import { generateHttpClient, generateResources, generateWSClient } from './generators/index.ts';
import { getCurrentDirname } from './utils.ts';

export async function generateTSClient(
    definition: APIDefinition,
    path: string,
) {
    const currentDir = getCurrentDirname(import.meta.url);

    console.log(`currentDir`)
    console.log(import.meta.url)
    console.log(currentDir)

    for (const [api, apiDefinition] of Object.entries(definition.apis)) {
        const apiSlug = api.replaceAll('\\', '_').replaceAll('/', '_');
        const apiPath = `${path}/${apiSlug}`;

        if (!(await exists(apiPath, { isDirectory: true }))) {
            await ensureDir(apiPath);
        }

        await copy(`${currentDir}/templates/common.ts`, `${apiPath}/common.ts`, { overwrite: true });

        await generateResources(apiPath, apiDefinition.resources);
        await copy(`${currentDir}/templates/api_index.ts`, `${apiPath}/index.ts`, { overwrite: true });

        await generateHttpClient(api, apiPath, apiDefinition.procedures);
        await generateWSClient(api, apiPath, apiDefinition.procedures);
    }
}
