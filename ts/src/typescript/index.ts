import { ensureDir, exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';
import { generateHttpClient, generateResources, generateWSClient } from './generators/index.ts';
import { fetchTemplateAPIIndex, fetchTemplateCommon } from './utils.ts';
import { apiSlug } from '../utils.ts';

export async function generateTypeScriptClient(
    definition: APIDefinition,
    path: string,
    apis?: string[],
) {
    const commonFileContent = await fetchTemplateCommon();
    const indexFileContent = await fetchTemplateAPIIndex();

    for (const [api, apiDefinition] of Object.entries(definition.apis)) {
        if (apis && apis.length > 0 && !apis.includes(api)) {
            continue;
        }

        const apiPath = `${path}/${apiSlug(api)}`;

        if (!(await exists(apiPath, { isDirectory: true }))) {
            await ensureDir(apiPath);
        }

        await Deno.writeTextFile(`${apiPath}/common.ts`, commonFileContent);

        await generateResources(apiPath, apiDefinition.resources);
        await Deno.writeTextFile(`${apiPath}/index.ts`, indexFileContent);

        await generateHttpClient(api, apiPath, apiDefinition.procedures);
        await generateWSClient(api, apiPath, apiDefinition.procedures);
    }
}
