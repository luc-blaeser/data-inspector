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

export function bits64ToFloat(bits64: bigint, littleEndian: boolean) {
    const buffer = new ArrayBuffer(8);
    const uint8Array = new Uint8Array(buffer);
    const float64Array = new Float64Array(buffer);
    const uint64 = BigInt.asUintN(64, bits64);
    for (let i = 0; i < 8; i++) {
        const shift = BigInt(littleEndian ? i : 7 - i) * 8n;
        uint8Array[i] = Number((uint64 >> shift) & 0xFFn);
    }
    return float64Array[0];
}

export function bits64ToSignedInt(bits64: bigint): bigint {
    return signedInt(bits64, 64);
}

export function signedInt(bits: bigint, width: number): bigint {
    if (width <= 0) {
        throw new Error("Invalid integer width");
    }
    const negative = (bits >> BigInt(width - 1)) !== 0n;
    if (negative) {
        const MASK = (1n << BigInt(width)) - 1n;
        const firstComplement = bits ^ MASK;
        const secondComplement = firstComplement + 1n;
        return -secondComplement;
    } else {
        return bits;
    }
}
