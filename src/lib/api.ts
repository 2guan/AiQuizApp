
const BASE_PATH = '/quiz';

export const fetchApi = async (url: string, options?: RequestInit) => {
    // Ensure url starts with /
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    // If url already starts with base path, don't prepend
    const finalUrl = normalizedUrl.startsWith(BASE_PATH)
        ? normalizedUrl
        : `${BASE_PATH}${normalizedUrl}`;

    return fetch(finalUrl, options);
};


export const getAssetPath = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return normalizedPath.startsWith(BASE_PATH)
        ? normalizedPath
        : `${BASE_PATH}${normalizedPath}`;
};
