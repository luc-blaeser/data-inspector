import { MotokoHeap, Objects, ObjectId, HeapObject, MotokoObject, MotokoBlob, MotokoBigInt, MotokoArray, MotokoText, MotokoMutBox, MotokoClosure, MotokoActor, MotokoVariant, MotokoValue, MotokoPointer, MotokoBool, MotokoCompactBigInt, MotokoSharedFunction, MotokoTuple, MotokoConcat, MotokoPrincipal } from "./DataFormat";

const WORD_SIZE = 8;
const LITTLE_ENDIAN = true;
type Word = bigint;

export class DataParser {
    data: DataView;
    position: number;

    public static parse(blob: Uint8Array): MotokoHeap {
        return new this(blob).parseHeap();
    }

    private constructor(blob: Uint8Array) {
        if (blob.length % WORD_SIZE !== 0) {
            throw new Error("Data must be a multiple of word size");
        }
        this.data = new DataView(blob.buffer);
        this.position = 0;
    }

    private parseHeap(): MotokoHeap {
        const version = Number(this.nextWord());
        const root = this.parseValue();
        const objects = this.parseObjects();
        return {
            version, root, objects
        }
    }

    private parseObjects(): Objects {
        const objects: Objects = new Map();
        while (this.hasMore()) {
            const heapObject = this.parseHeapObject();
            objects.set(heapObject.objectId, heapObject);
        }
        return objects;
    }

    private parseHeapObject(): HeapObject {
        const objectId = this.nextWord() as ObjectId;
        const tagNumber = Number(this.nextWord());
        const objectTag = ObjectTag.fromValue(tagNumber);
        if (objectTag == null) {
            throw new Error("Invalid object tag " + tagNumber);
        }
        switch (objectTag) {
            case ObjectTag.TAG_OBJECT:
                return this.parseRegularObject(objectId);
            case ObjectTag.TAG_BLOB_B:
            case ObjectTag.TAG_BLOB_T:
            case ObjectTag.TAG_BLOB_P:
            case ObjectTag.TAG_BLOB_A:
                return this.parseBlob(objectId, objectTag);
            case ObjectTag.TAG_BIGINT:
                return this.parseBigInteger(objectId);
            case ObjectTag.TAG_ARRAY_M:
            case ObjectTag.TAG_ARRAY_I:
            case ObjectTag.TAG_ARRAY_T:
            case ObjectTag.TAG_ARRAY_S:
                return this.parseArray(objectId, objectTag);
            case ObjectTag.TAG_MUTBOX:
                return this.parseMutBox(objectId);
            case ObjectTag.TAG_CLOSURE:
                return this.parseClosure(objectId);
            case ObjectTag.TAG_VARIANT:
                return this.parseVariant(objectId);
            case ObjectTag.TAG_CONCAT:
                return this.parseConcat(objectId);
            default:
                throw new Error(`Unsupported object tag ${objectTag}`);
        }
    }

    private parseConcat(objectId: ObjectId): MotokoConcat {
        const length = this.nextWord() as bigint;
        const text1 = this.parseValue();
        const text2 = this.parseValue();
        return new MotokoConcat(objectId, length, text1, text2);
    }

    private parseVariant(objectId: ObjectId): MotokoVariant {
        const tag = Number(this.nextWord());
        const field = this.parseValue();
        return new MotokoVariant(objectId, tag, field);
    }

    private parseClosure(objectId: ObjectId): MotokoClosure {
        const functionId = Number(this.nextWord());
        const size = Number(this.nextWord());
        const elements: MotokoValue[] = [];
        for (let index = 0; index < size; index++) {
            elements.push(this.parseValue());
        }
        return new MotokoClosure(objectId, functionId, elements);
    }

    private parseMutBox(objectId: ObjectId): MotokoMutBox {
        const field = this.parseValue();
        return new MotokoMutBox(objectId, field);
    }

    private parseBigInteger(objectId: ObjectId): MotokoBigInt {
        const used = this.nextUInt32();
        const alloc = this.nextUInt32();
        const sign = this.nextUInt32();
        if (sign > 1) {
            throw new Error("Invalid BigInt sign");
        }
        this.skip(4); // Skip padding.
        this.skip(WORD_SIZE); // Skip `dp`.
        if (used > alloc) {
            throw new Error(`Invalid BigInt length: alloc ${alloc}, used ${used}`);
        }
        let value = 0n;
        for (let index = 0; index < used; index++) {
            const element = this.nextWord();
            const base = 1n << 60n;
            value = value * base + element;
        }
        for (let index = used; index < alloc; index++) {
            this.skip(WORD_SIZE); // Skip unused space.
        }
        if (sign != 0) {
            value = -value;
        }
        return new MotokoBigInt(objectId, value);
    }

    private parseArray(objectId: ObjectId, objectTag: ObjectTag): HeapObject {
        const length = this.nextWord();
        const elements: MotokoValue[] = [];
        for (let index = 0; index < length; index++) {
            elements.push(this.parseValue());
        }
        switch (objectTag) {
            case ObjectTag.TAG_ARRAY_I:
            case ObjectTag.TAG_ARRAY_M:
                return new MotokoArray(objectId, objectTag == ObjectTag.TAG_ARRAY_M, elements);
            case ObjectTag.TAG_ARRAY_T:
                return new MotokoTuple(objectId, elements);
            case ObjectTag.TAG_ARRAY_S:
                if (elements.length != 2) {
                    throw new Error("Invalid shared function");
                }
                return new MotokoSharedFunction(objectId, elements[0], elements[1]);
            default:
                throw new Error(`Unsupported array tag ${objectTag}`);
        }
    }

    private parseBlob(objectId: ObjectId, objectTag: ObjectTag): HeapObject {
        const length = Number(this.nextWord());
        const bytes = this.readBytes(length);
        this.alignToWord();
        switch (objectTag) {
            case ObjectTag.TAG_BLOB_B:
                return new MotokoBlob(objectId, bytes);
            case ObjectTag.TAG_BLOB_T:
                const text = String.fromCharCode.apply(null, Array.from(bytes));
                return new MotokoText(objectId, text);
            case ObjectTag.TAG_BLOB_A:
                return new MotokoActor(objectId, bytes);
            case ObjectTag.TAG_BLOB_P:
                return new MotokoPrincipal(objectId, bytes);
            default:
                throw new Error(`Unsupported blob tag ${objectTag}`);
        }
    }

    private parseRegularObject(objectId: ObjectId): MotokoObject {
        const numberOfFields = Number(this.nextWord());
        const hashBlob = this.parseValue();
        const fields: MotokoValue[] = [];
        for (let index = 0; index < numberOfFields; index++) {
            fields.push(this.parseValue());
        }
        return new MotokoObject(objectId, hashBlob, fields);
    }

    private parseValue(): MotokoValue {
        const word = this.nextWord();
        if (word == 0n) {
            return new MotokoBool(false);
        } else if (word == 1n) {
            return new MotokoBool(true);
        } else if ((word & 1n) == 1n) {
            return new MotokoPointer(word);
        } else if ((word & 3n) == 2n) {
            return new MotokoCompactBigInt(word >> 2n);
        } else {
            throw new Error(`Unsupported value ${word}`);
        }
    }

    private hasMore(): boolean {
        return this.position < this.data.byteLength;
    }

    private nextWord(): Word {
        this.ensure(WORD_SIZE);
        this.checkAlignment(WORD_SIZE);
        // Nat64 requires Big integer in JS for full precision.
        let word = this.data.getBigUint64(this.position, LITTLE_ENDIAN);
        this.position += WORD_SIZE;
        return word;
    }

    private nextUInt32(): number {
        const UINT32_SIZE = 4;
        this.ensure(UINT32_SIZE);
        let value = this.data.getUint32(this.position, LITTLE_ENDIAN);
        this.position += UINT32_SIZE;
        return value;
    }

    private readBytes(length: number): Uint8Array {
        this.ensure(length);
        const buffer = this.data.buffer.slice(this.position, this.position + length);
        const data = new DataView(buffer);
        this.position += length;
        return new Uint8Array(data.buffer);
    }

    private alignToWord() {
        if (this.position % WORD_SIZE != 0) {
            let padding = WORD_SIZE - this.position % WORD_SIZE;
            this.skip(padding);
        }
        this.checkAlignment(WORD_SIZE);
    }

    private skip(length: number) {
        this.ensure(length);
        this.position += length;
    }

    private ensure(length: number) {
        if (this.position + length > this.data.byteLength) {
            throw new Error("Parsing beyond data end");
        }
    }

    private checkAlignment(length: number) {
        if (this.position % length != 0) {
            throw new Error(`Misaligned read ${length}`);
        }
    }
}

// Synchroize with Motoko RTS, enhanced orthogonal persistence and precise tagging.
enum ObjectTag {
    TAG_OBJECT = 1,
    TAG_ARRAY_I = 3, // Immutable Array ([T])
    TAG_ARRAY_M = 5, // Mutable Array ([var T])
    TAG_ARRAY_T = 7, // Non-nullary Tuple ((T,+))
    TAG_ARRAY_S = 9, // Shared function pairing TAG_BLOB_A with TAG_BLOB_T (shared ... -> ...)
    TAG_BITS64_U = 11, // Unsigned (Nat64)
    TAG_BITS64_S = 13, // Signed (Int64)
    TAG_BITS64_F = 15, // Float
    TAG_MUTBOX = 17,
    TAG_CLOSURE = 19,
    TAG_SOME = 21,
    TAG_VARIANT = 23,
    TAG_BLOB_B = 25, // Blob of Bytes (Blob)
    TAG_BLOB_T = 27, // Blob of Utf8 (Text)
    TAG_BLOB_P = 29, // Principal (Principal)
    TAG_BLOB_A = 31, // Actor (actor {})
    TAG_BIGINT = 35,
    TAG_CONCAT = 37,
    TAG_REGION = 39,
}

namespace ObjectTag {
    export function fromValue(value: number): ObjectTag | undefined {
        return (Object.values(ObjectTag) as number[]).includes(value)
            ? value as ObjectTag
            : undefined;
    }

    export function toString(tag: ObjectTag): string {
        return ObjectTag[tag];
    }
}
