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
