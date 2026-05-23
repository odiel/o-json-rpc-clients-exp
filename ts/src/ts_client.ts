import { copy, ensureDir, exists } from '@std/fs';
import type { APIDefinition } from '@o-json-rpc/o-json-rpc-ts';
import { generateHttpClient, generateResources, generateWSClient } from './generators/index.ts';
import {fetchCommonFileContent, fetchIndexFileContent} from "./utils.ts";

export async function generateTSClient(
    definition: APIDefinition,
    path: string,
) {
    const commonFileContent = await fetchCommonFileContent();
    const indexFileContent = await fetchIndexFileContent();

    for (const [api, apiDefinition] of Object.entries(definition.apis)) {
        const apiSlug = api.replaceAll('\\', '_').replaceAll('/', '_');
        const apiPath = `${path}/${apiSlug}`;

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
