import { HeapObject, MotokoHeap, MotokoPointer, MotokoValue, ObjectId } from "../DataFormat";
import { Visualizer } from "./Visualizer";

export class DetailedVisualizer extends Visualizer {
    heap: MotokoHeap;

    public constructor(heap: MotokoHeap) {
        super();
        this.heap = heap;
    }

    getRoot(): ObjectId {
        return (this.heap.root as MotokoPointer).objectId;
    }

    getNodes(): HeapObject[] {
        return Array.from(this.heap.objects.values());
    }

    getNode(objectId: ObjectId): HeapObject {
        return this.heap.objects.get(objectId)!;
    }

    pointsToNode(value: MotokoValue): boolean {
        return value instanceof MotokoPointer;
    }

    getReferences(heapObject: any): ObjectId[] {
        return heapObject.getFields().
            filter((field: MotokoValue) => field instanceof MotokoPointer).
            map((field: MotokoValue) => (field as MotokoPointer).objectId);
    }
}
