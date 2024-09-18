import { HeapObject, MotokoActor, MotokoArray, MotokoBlob, MotokoBool, MotokoCompactBigInt, MotokoHeap, MotokoMutBox, MotokoObject, MotokoPointer, MotokoSharedFunction, MotokoText, MotokoTuple, MotokoValue, ObjectId } from "../DataFormat";
import { stringify } from "../Utilities";
import { Visualizer } from "./Visualizer";

export class DetailedVisualizer implements Visualizer {
    heap: MotokoHeap;

    public constructor(heap: MotokoHeap) {
        this.heap = heap;
    }

    getRoot(): ObjectId {
        return (this.heap.root as MotokoPointer).objectId;
    }

    getNodes(): HeapObject[] {
        return Array.from(this.heap.objects.values());
    }

    getLabel(heapObject: HeapObject): string {
        if (heapObject instanceof MotokoText) {
            return `"${heapObject.value}"`;
        } else if (heapObject instanceof MotokoMutBox) {
            return `var ${this.valueToText(heapObject.field)}`;
        } else if (heapObject instanceof MotokoObject) {
            let text = "{ ";
            for (let field of heapObject.fields) {
                if (!(field instanceof MotokoPointer)) {
                    text += `${this.valueToText(field)}; `;
                }
            }
            text += "}";
            return text;
        } else if (heapObject instanceof MotokoArray) {
            let text = "[ ";
            for (let element of heapObject.elements) {
                if (!(element instanceof MotokoPointer)) {
                    text += `${this.valueToText(element)}, `;
                }
            }
            text += "]";
            return text;
        } else if (heapObject instanceof MotokoTuple) {
            let text = "( ";
            for (let element of heapObject.elements) {
                if (!(element instanceof MotokoPointer)) {
                    text += `${this.valueToText(element)}, `;
                }
            }
            text += ")";
            return text;
        } else if (heapObject instanceof MotokoBlob) {
            return "blob";
        } else if (heapObject instanceof MotokoActor) {
            return "actor";
        } else if (heapObject instanceof MotokoSharedFunction) {
            return "shared function";
        } else {
            return stringify(heapObject);
        }
    }

    private valueToText(value: MotokoValue): string {
        if (value instanceof MotokoPointer) {
            return "";
        } else if (value instanceof MotokoBool) {
            return value.value.toString();
        } else if (value instanceof MotokoCompactBigInt) {
            return value.value.toString();
        } else {
            throw new Error(`Unsupported value ${value.valueType}`);
        }
    }

    getReferences(heapObject: any): ObjectId[] {
        return heapObject.getFields().
            filter((field: MotokoValue) => field instanceof MotokoPointer).
            map((field: MotokoValue) => (field as MotokoPointer).objectId);
    }
}
