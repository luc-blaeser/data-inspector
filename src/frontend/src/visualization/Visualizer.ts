import { HeapObject, MotokoActor, MotokoArray, MotokoBigInt, MotokoBlob, MotokoBool, MotokoCharacter, MotokoClosure, MotokoCompactBigInt, MotokoCompactInt16, MotokoCompactInt32, MotokoCompactInt64, MotokoCompactInt8, MotokoCompactNat16, MotokoCompactNat32, MotokoCompactNat64, MotokoCompactNat8, MotokoConcat, MotokoFloat64, MotokoInt64, MotokoMutBox, MotokoNat64, MotokoObject, MotokoPointer, MotokoPrincipal, MotokoRegion, MotokoSharedFunction, MotokoSome, MotokoText, MotokoTuple, MotokoValue, MotokoVariant, ObjectId } from "../DataFormat";
import { stringify } from "../Utilities";

export abstract class Visualizer {
    abstract getRoot(): ObjectId;
    abstract getNodes(): HeapObject[];
    abstract getNode(objectId: ObjectId): HeapObject;
    abstract getReferences(heapObject: HeapObject): ObjectId[];
    abstract pointsToNode(value: MotokoValue): boolean;

    getLabel(heapObject: HeapObject): string {
        if (heapObject instanceof MotokoText) {
            return `"${heapObject.value}"`;
        } else if (heapObject instanceof MotokoConcat) {
            let text = "";
            if (!this.pointsToNode(heapObject.text1)) {
                text += this.valueToText(heapObject.text1);
            }
            if (!this.pointsToNode(heapObject.text2)) {
                text += this.valueToText(heapObject.text2);
            }
            return text;
        } else if (heapObject instanceof MotokoMutBox) {
            let text = "var"
            if (!this.pointsToNode(heapObject.field)) {
                text += ` ${this.valueToText(heapObject.field)}`;
            }
            return text;
        } else if (heapObject instanceof MotokoObject) {
            let text = "{ ";
            for (let field of heapObject.fields) {
                if (!this.pointsToNode(field)) {
                    text += `${this.valueToText(field)}; `;
                }
            }
            text += "}";
            return text;
        } else if (heapObject instanceof MotokoArray) {
            let text = "[ ";
            for (let element of heapObject.elements) {
                if (!this.pointsToNode(element)) {
                    text += `${this.valueToText(element)}, `;
                }
            }
            text += "]";
            return text;
        } else if (heapObject instanceof MotokoTuple) {
            let text = "( ";
            for (let element of heapObject.elements) {
                if (!this.pointsToNode(element)) {
                    text += `${this.valueToText(element)}, `;
                }
            }
            text += ")";
            return text;
        } else if (heapObject instanceof MotokoBlob) {
            return "blob";
        } else if (heapObject instanceof MotokoPrincipal) {
            return "principal";
        } else if (heapObject instanceof MotokoActor) {
            return "actor";
        } else if (heapObject instanceof MotokoSharedFunction) {
            return "shared function";
        } else if (heapObject instanceof MotokoClosure) {
            return "closure";
        } else if (heapObject instanceof MotokoVariant) {
            return "variant";
        } else if (heapObject instanceof MotokoNat64 || 
            heapObject instanceof MotokoInt64 || 
            heapObject instanceof MotokoFloat64 ||
            heapObject instanceof MotokoBigInt) {
            return heapObject.value.toString();
        } else if (heapObject instanceof MotokoRegion) {
            return `region ${heapObject.regionId}`;
        } else if (heapObject instanceof MotokoSome) {
            let text = "?"
            if (!this.pointsToNode(heapObject.field)) {
                text += `${this.valueToText(heapObject.field)}`;
            }
            return text;
        } else {
            return stringify(heapObject);
        }
    }

    private valueToText(value: MotokoValue): string {
        if (value instanceof MotokoPointer) {
            if (value.isNull()) {
                return "null";
            } else if (!this.pointsToNode(value)) {
                const target = this.getNode(value.objectId)!;
                return this.getLabel(target);
            } else {
                return "pointer";
            }
        } else if (value instanceof MotokoBool ||
            value instanceof MotokoCompactBigInt ||
            value instanceof MotokoCompactNat64 ||
            value instanceof MotokoCompactInt64 || 
            value instanceof MotokoCompactNat32 ||
            value instanceof MotokoCompactInt32 ||
            value instanceof MotokoCompactNat16 ||
            value instanceof MotokoCompactInt16 ||
            value instanceof MotokoCompactNat8 ||
            value instanceof MotokoCompactInt8 ||
            value instanceof MotokoCharacter) {
            return value.value.toString();
        } else {
            throw new Error(`Unsupported value ${value.valueType}`);
        }
    }
}
