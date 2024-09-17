import { HeapObject, MotokoValue, ObjectId } from "../DataFormat";

export interface Visualizer {
    getRoot(): ObjectId;
    getNodes(): HeapObject[];
    getLabel(heapObject: HeapObject): string;
    getReferences(heapObject: HeapObject): ObjectId[];
}
