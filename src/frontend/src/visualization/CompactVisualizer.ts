import { HeapObject, MotokoActor, MotokoArray, MotokoBigInt, MotokoBlob, MotokoBool, MotokoClosure, MotokoCompactBigInt, MotokoHeap, MotokoMutBox, MotokoObject, MotokoPointer, MotokoSharedFunction, MotokoText, MotokoValue, MotokoVariant, NULL_POINTER, ObjectId } from "../DataFormat";
import { stringify } from "../Utilities";
import { Visualizer } from "./Visualizer";

export class CompactVisualizer implements Visualizer {
    heap: MotokoHeap;
    nodes: Map<ObjectId, HeapObject> = new Map();

    public constructor(heap: MotokoHeap) {
        this.heap = heap;
        this.collectNodes();
    }

    private collectNodes() {
        const pending: HeapObject[] = [];
        const root = this.heap.objects.get(this.getRoot())!;
        pending.push(root);
        while (pending.length > 0) {
            const current = pending.shift()!;
            if (this.nodes.get(current.objectId) == null) {
                this.nodes.set(current.objectId, current);
                for (let targetId of this.getReferences(current)) {
                    if (targetId != NULL_POINTER) {
                        const target = this.heap.objects.get(targetId)!;
                        pending.push(target);
                    }
                }
            }
        }
    }

    getRoot(): ObjectId {
        return (this.heap.root as MotokoPointer).objectId;
    }

    getNodes(): HeapObject[] {
        return Array.from(this.nodes.values());
    }

    isReference(value: MotokoValue): boolean {
        if (value instanceof MotokoPointer && !value.isNull()) {
            const target = this.heap.objects.get(value.objectId)!;
            return (target instanceof MotokoArray || target instanceof MotokoObject || target instanceof MotokoVariant);
        } else {
            return false;
        }
    }

    getLabel(heapObject: HeapObject): string {
        if (heapObject instanceof MotokoText) {
            return `"${heapObject.value}"`;
        } else if (heapObject instanceof MotokoMutBox) {
            return `var ${this.valueToText(heapObject.field)}`;
        } else if (heapObject instanceof MotokoObject) {
            let text = "{ ";
            for (let field of heapObject.fields) {
                if (!this.isReference(field)) {
                    text += `${this.valueToText(field)}; `;
                }
            }
            text += "}";
            return text;
        } else if (heapObject instanceof MotokoArray) {
            let text = "[ ";
            for (let element of heapObject.elements) {
                if (!this.isReference(element)) {
                    text += `${this.valueToText(element)}, `;
                }
            }
            text += "]";
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
            if (!this.isReference(value)) {
                const target = this.heap.objects.get(value.objectId)!;
                return this.getLabel(target);
            } else {
                return "pointer";
            }
        } else if (value instanceof MotokoBool) {
            return value.value.toString();
        } else if (value instanceof MotokoCompactBigInt) {
            return value.value.toString();
        } else {
            throw new Error(`Unsupported value ${value.valueType}`);
        }
    }

    getReferences(heapObject: HeapObject): ObjectId[] {
        const fields = heapObject.getFields();
        let references: ObjectId[] = [];
        for (let field of fields) {
            if (field instanceof MotokoPointer && !field.isNull()) {
                const target = this.heap.objects.get(field.objectId)!;
                if (this.isReference(field)) {
                    references.push(target.objectId);
                } else {
                    references = references.concat(this.getReferences(target));
                }
            }
        }
        return references;
    }
}
