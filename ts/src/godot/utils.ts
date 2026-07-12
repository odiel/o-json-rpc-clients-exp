import { fetchTextFileContent } from '../utils.ts';

export async function fetchTemplateHTTPClient(): Promise<string> {
    const url = new URL('../../templates/godot/api_http_client.gd', import.meta.url);
    return await fetchTextFileContent(url);
}

export async function fetchCommon(): Promise<string> {
    const url = new URL('../../templates/godot/common.gd', import.meta.url);
    return await fetchTextFileContent(url);
}
