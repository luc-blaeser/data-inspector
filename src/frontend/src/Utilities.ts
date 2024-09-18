export function stringify(obj: any): string {
    return JSON.stringify(obj, (_key, value) => {
        if (value instanceof Map) {
            return Array.from(value.entries()).map(([k, v]) => ({
                key: k,
                value: v
            }));
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    });
}
