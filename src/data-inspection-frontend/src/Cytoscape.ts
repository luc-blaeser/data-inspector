import { HeapObject, MotokoActor, MotokoArray, MotokoBigInt, MotokoBlob, MotokoBool, MotokoClosure, MotokoCompactBigInt, MotokoHeap, MotokoMutBox, MotokoObject, MotokoPointer, MotokoSharedFunction, MotokoText, MotokoValue, MotokoVariant, ObjectType } from "./DataFormat";
import cytoscape, { Core, ElementDefinition, LayoutOptions, Stylesheet } from 'cytoscape';
import { stringify } from "./Utilities";

export class CytospaceConverter {
    private heap: MotokoHeap;
    private elements: ElementDefinition[];

    constructor(heap: MotokoHeap) {
        this.heap = heap;
        this.elements = [];
    }

    public renderCytoscape(container: HTMLElement): Core {
        this.addNodes();
        for (let heapObject of this.heap.objects) {
            this.addEdges(heapObject);
        }
        this.addRoots();
        return this.createCytoscape(container);
    }

    private createCytoscape(container: HTMLElement): Core {
        const stylesheets: Stylesheet[] = [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#666',
                    'color': '#555',
                }
            },
            {
                selector: 'edge',
                style: {
                    'label': 'data(label)',
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                }
            }
        ];

        const layoutOptions: LayoutOptions = {
            name: 'cose',
            idealEdgeLength: (_edge) => 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: (_edge) => 400000,
            edgeElasticity: (_edge) => 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        };

        return cytoscape({
            container: container,
            elements: this.elements,
            style: stylesheets,
            layout: layoutOptions
        });
    }

    private addNodes() {
        for (let heapObject of this.heap.objects) {
            this.elements.push({
                data: {
                    id: heapObject.objectId.toString(),
                    label: this.getLabel(heapObject),
                    ...heapObject
                }
            });
        }
    }

    private addRoots() {
        const ROOTS_ID = "MainActor";
        this.elements.push({
            data: {
                id: ROOTS_ID,
                label: ROOTS_ID,
            }
        });
        this.addFields(ROOTS_ID, this.heap.roots);
    }

    private getLabel(heapObject: HeapObject): string {
        if (heapObject instanceof MotokoText) {
            return `"${heapObject.value}"`;
        } else if (heapObject instanceof MotokoMutBox) {
            return `mut ${this.valueToText(heapObject.field)}`;
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

    private getFields(heapObject: HeapObject): MotokoValue[] {
        if (heapObject instanceof MotokoObject) {
            return [heapObject.hashBlob].concat(heapObject.fields);
        } else if (heapObject instanceof MotokoArray) {
            return heapObject.elements;
        } else if (heapObject instanceof MotokoMutBox) {
            return [heapObject.field];
        } else if (heapObject instanceof MotokoClosure) {
            return heapObject.elements;
        } else if (heapObject instanceof MotokoVariant) {
            return [heapObject.field];
        } else if (heapObject instanceof MotokoBlob ||
            heapObject instanceof MotokoText ||
            heapObject instanceof MotokoActor ||
            heapObject instanceof MotokoBigInt) {
            return [];
        } else if (heapObject instanceof MotokoSharedFunction) {
            return [heapObject.actor, heapObject.functionName];
        } else {
            throw new Error(`Unsupported heap object type ${heapObject.objectType}`);
        }
    }

    private addEdges(source: HeapObject) {
        const sourceId = source.objectId.toString();
        const fields = this.getFields(source);
        this.addFields(sourceId, fields);
    }

    private addFields(sourceId: string, fields: MotokoValue[]) {
        fields.forEach((field: MotokoValue, index: number) => {
            if (field instanceof MotokoPointer && !field.isNull()) {
                const targetId = field.objectId;
                this.elements.push({
                    data: {
                        id: `${sourceId}_to_${targetId}_${index}`,
                        source: sourceId,
                        target: targetId.toString(),
                        label: "",
                    }
                });
            }
        });
    }
}
