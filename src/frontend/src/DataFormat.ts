export type MotokoHeap = {
    version: number,
    root: MotokoValue,
    objects: Objects,
};
export type Objects = Map<ObjectId, HeapObject>;
export type ObjectId = bigint;

export enum ObjectType {
    ACTOR = "actor",
    ARRAY = "array",
    CLOSURE = "closure",
    CONCAT = "concat",
    BIGINT = "bigint",
    BLOB = "blob",
    FLOAT64 = "float64",
    INT64 = "int64",
    MUTBOX = "mutbox",
    NAT64 = "nat64",
    OBJECT = "object",
    PRINCIPAL = "principal",
    REGION = "region",
    SHARED_FUNCTION = "shared_function",
    SOME = "some",
    TEXT = "text",
    VARIANT = "variant",
}

export abstract class HeapObject {
    objectId: ObjectId;
    objectType: ObjectType;

    constructor(objectId: ObjectId, objectType: ObjectType) {
        this.objectId = objectId;
        this.objectType = objectType;
    }

    abstract getFields(): MotokoValue[];
}

export class MotokoObject extends HeapObject {
    hashBlob: MotokoValue;
    fields: MotokoValue[];

    public constructor(objectId: ObjectId, hashBlob: MotokoValue, fields: MotokoValue[]) {
        super(objectId, ObjectType.OBJECT);
        this.hashBlob = hashBlob;
        this.fields = fields;
    }

    getFields(): MotokoValue[] {
        return [this.hashBlob].concat(this.fields);
    }
}

export class MotokoBlob extends HeapObject {
    bytes: Uint8Array;

    public constructor(objectId: ObjectId, bytes: Uint8Array) {
        super(objectId, ObjectType.BLOB);
        this.bytes = bytes;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoPrincipal extends HeapObject {
    bytes: Uint8Array;

    public constructor(objectId: ObjectId, bytes: Uint8Array) {
        super(objectId, ObjectType.PRINCIPAL);
        this.bytes = bytes;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoBigInt extends HeapObject {
    value: bigint;

    public constructor(objectId: ObjectId, value: bigint) {
        super(objectId, ObjectType.BIGINT);
        this.value = value;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoNat64 extends HeapObject {
    value: bigint;

    public constructor(objectId: ObjectId, value: bigint) {
        super(objectId, ObjectType.NAT64);
        this.value = value;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoInt64 extends HeapObject {
    value: bigint;

    public constructor(objectId: ObjectId, value: bigint) {
        super(objectId, ObjectType.INT64);
        this.value = value;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoFloat64 extends HeapObject {
    value: number;

    public constructor(objectId: ObjectId, value: number) {
        super(objectId, ObjectType.FLOAT64);
        this.value = value;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoArray extends HeapObject {
    mutable: boolean;
    elements: MotokoValue[];

    public constructor(objectId: ObjectId, mutable: boolean, elements: MotokoValue[]) {
        super(objectId, ObjectType.ARRAY);
        this.mutable = mutable;
        this.elements = elements;
    }

    getFields(): MotokoValue[] {
        return this.elements;;
    }
}

export class MotokoTuple extends HeapObject {
    elements: MotokoValue[];

    public constructor(objectId: ObjectId, elements: MotokoValue[]) {
        super(objectId, ObjectType.ARRAY);
        this.elements = elements;
    }

    getFields(): MotokoValue[] {
        return this.elements;;
    }
}

export class MotokoText extends HeapObject {
    value: string;

    public constructor(objectId: ObjectId, value: string) {
        super(objectId, ObjectType.TEXT);
        this.value = value;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoConcat extends HeapObject {
    length: bigint;
    text1: MotokoValue;
    text2: MotokoValue;

    constructor(objectId: ObjectId, length: bigint, text1: MotokoValue, text2: MotokoValue) {
        super(objectId, ObjectType.CONCAT);
        this.length = length;
        this.text1 = text1;
        this.text2 = text2;
    }

    getFields(): MotokoValue[] {
        return [this.text1, this.text2];
    }
}

export class MotokoMutBox extends HeapObject {
    field: MotokoValue;

    public constructor(objectId: ObjectId, field: MotokoValue) {
        super(objectId, ObjectType.MUTBOX);
        this.field = field;
    }

    getFields(): MotokoValue[] {
        return [this.field];
    }
}

export class MotokoClosure extends HeapObject {
    functionId: number;
    elements: MotokoValue[];

    public constructor(objectId: ObjectId, functionId: number, elements: MotokoValue[]) {
        super(objectId, ObjectType.CLOSURE);
        this.functionId = functionId;
        this.elements = elements;
    }

    getFields(): MotokoValue[] {
        return this.elements;
    }
}

export class MotokoActor extends HeapObject {
    bytes: Uint8Array;

    public constructor(objectId: ObjectId, bytes: Uint8Array) {
        super(objectId, ObjectType.ACTOR);
        this.bytes = bytes;
    }

    getFields(): MotokoValue[] {
        return [];
    }
}

export class MotokoVariant extends HeapObject {
    tag: number;
    field: MotokoValue;

    public constructor(objectId: ObjectId, tag: number, field: MotokoValue) {
        super(objectId, ObjectType.VARIANT);
        this.tag = tag;
        this.field = field;
    }

    getFields(): MotokoValue[] {
        return [this.field];
    }
}

export class MotokoSharedFunction extends HeapObject {
    actor: MotokoValue;
    functionName: MotokoValue;

    public constructor(objectId: ObjectId, actor: MotokoValue, functionName: MotokoValue) {
        super(objectId, ObjectType.SHARED_FUNCTION);
        this.actor = actor;
        this.functionName = functionName;
    }

    getFields(): MotokoValue[] {
        return [this.actor, this.functionName];
    }
}

export class MotokoRegion extends HeapObject {
    regionId: bigint;
    pageCount: bigint;
    pageTable: MotokoValue;

    public constructor(objectId: ObjectId, regionId: bigint, pageCount: bigint, pageTable: MotokoValue) {
        super(objectId, ObjectType.REGION);
        this.regionId = regionId;
        this.pageCount = pageCount;
        this.pageTable = pageTable;
    }

    getFields(): MotokoValue[] {
        return [this.pageTable];
    }
}

export class MotokoSome extends HeapObject {
    field: MotokoValue;

    public constructor(objectId: ObjectId, field: MotokoValue) {
        super(objectId, ObjectType.SOME);
        this.field = field;
    }

    getFields(): MotokoValue[] {
        return [this.field];
    }
}

export enum ValueType {
    BIGINT = "bigint",
    BOOL = "bool",
    CHAR = "char",
    INT8 = "int8",
    INT16 = "int16",
    INT32 = "int32",
    INT64 = "int64",
    NAT8 = "nat8",
    NAT16 = "nat16",
    NAT32 = "nat32",
    NAT64 = "nat64",
    POINTER = "pointer",
}

export abstract class MotokoValue {
    valueType: ValueType;

    constructor(valueType: ValueType) {
        this.valueType = valueType;
    }
}

export const NULL_POINTER = 0xffff_ffff_ffff_fffbn;

export class MotokoPointer extends MotokoValue {
    objectId: ObjectId;

    public constructor(objectId: ObjectId) {
        super(ValueType.POINTER);
        this.objectId = objectId;
    }

    public isNull(): boolean {
        return this.objectId == NULL_POINTER;
    }
}

export class MotokoBool extends MotokoValue {
    value: boolean;

    public constructor(value: boolean) {
        super(ValueType.BOOL);
        this.value = value;
    }
}

export class MotokoCompactBigInt extends MotokoValue {
    value: bigint;

    public constructor(value: bigint) {
        super(ValueType.BIGINT);
        this.value = value;
    }
}

export class MotokoCompactNat64 extends MotokoValue {
    value: bigint;

    public constructor(value: bigint) {
        super(ValueType.NAT64);
        this.value = value;
    }
}

export class MotokoCompactInt64 extends MotokoValue {
    value: bigint;

    public constructor(value: bigint) {
        super(ValueType.INT64);
        this.value = value;
    }
}

export class MotokoCompactNat32 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.NAT32);
        this.value = value;
    }
}

export class MotokoCompactInt32 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.INT32);
        this.value = value;
    }
}

export class MotokoCompactNat16 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.NAT16);
        this.value = value;
    }
}

export class MotokoCompactInt16 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.INT16);
        this.value = value;
    }
}


export class MotokoCompactNat8 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.NAT8);
        this.value = value;
    }
}

export class MotokoCompactInt8 extends MotokoValue {
    value: number;

    public constructor(value: number) {
        super(ValueType.INT8);
        this.value = value;
    }
}

export class MotokoCharacter extends MotokoValue {
    value: string;

    public constructor(value: string) {
        super(ValueType.CHAR);
        this.value = value;
    }
}
