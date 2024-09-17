export function stringify(obj: any): string {
    return JSON.stringify(obj, (_key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    );
}
