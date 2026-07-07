/**
 * Returns the content of a file for the given url
 * @param url
 */
export async function fetchTextFileContent(url: URL): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to retrieve ${url.toString()} content.`);
    }

    return await response.text();
}

export function apiSlug(api: string) {
    return api.replaceAll(/[.]|[\/]|[-]/g, '_');
}

export function snakeCase(value: string) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
}
