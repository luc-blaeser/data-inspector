import { HeapObject, MotokoArray, MotokoHeap, MotokoMutBox, MotokoObject, MotokoPointer, MotokoTuple, MotokoValue, MotokoVariant, NULL_POINTER, ObjectId } from "../DataFormat";
import { Visualizer } from "./Visualizer";

export class CompactVisualizer extends Visualizer {
    heap: MotokoHeap;
    nodes: Map<ObjectId, HeapObject> = new Map();

    public constructor(heap: MotokoHeap) {
        super();
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

    getNode(objectId: ObjectId): HeapObject {
        return this.heap.objects.get(objectId)!;
    }

    isNode(heapObject: HeapObject): boolean {
        return heapObject instanceof MotokoArray ||
            heapObject instanceof MotokoTuple ||
            heapObject instanceof MotokoObject ||
            heapObject instanceof MotokoVariant;
    }

    pointsToNode(value: MotokoValue): boolean {
        if (value instanceof MotokoPointer && !value.isNull()) {
            const target = this.heap.objects.get(value.objectId)!;
            return (target instanceof MotokoMutBox && this.pointsToNode(target.field)) ||
                this.isNode(target);
        } else {
            return false;
        }
    }

    getReferences(heapObject: HeapObject): ObjectId[] {
        const fields = heapObject.getFields();
        let references: ObjectId[] = [];
        for (let field of fields) {
            if (field instanceof MotokoPointer && !field.isNull()) {
                const target = this.heap.objects.get(field.objectId)!;
                if (this.isNode(target)) {
                    references.push(target.objectId);
                } else {
                    references = references.concat(this.getReferences(target));
                }
            }
        }
        return references;
    }
}
