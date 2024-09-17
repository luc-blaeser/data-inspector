import { HeapObject, NULL_POINTER, ObjectId } from "../DataFormat";
import cytoscape, { Core, ElementDefinition, LayoutOptions, Stylesheet } from 'cytoscape';
import { Visualizer } from "./Visualizer";

class Graph {
    private elements: ElementDefinition[];
    private visualizer: Visualizer;

    constructor(visualizer: Visualizer) {
        this.elements = [];
        this.visualizer = visualizer;
        this.convert();
    }

    private convert() {
        const nodes = this.visualizer.getNodes();
        for (let node of nodes) {
            this.addNode(node);
        }
        for (let node of nodes) {
            this.addEdges(node);
        }
    }

    private addNode(heapObject: HeapObject) {
        const objectId = heapObject.objectId;
        const isRoot = objectId == this.visualizer.getRoot();
        let prefix = "";
        if (isRoot) {
            prefix = "MainActor "
        }
        const element: ElementDefinition = {
            data: {
                id: heapObject.objectId.toString(),
                label: prefix + this.visualizer.getLabel(heapObject),
            },
        };
        if (isRoot) {
            element.style = {
                'background-color': 'red',
            };
        }
        this.elements.push(element);
    }

    private addEdges(source: HeapObject) {
        const sourceId = source.objectId.toString();
        const references = this.visualizer.getReferences(source);
        this.addReferences(sourceId, references);
    }

    private addReferences(sourceId: string, references: ObjectId[]) {
        references.forEach((targetId: ObjectId, index: number) => {
            if (targetId != NULL_POINTER) {
                this.elements.push({
                    data: {
                        id: `${sourceId}_to_${targetId}_${index}`,
                        source: sourceId,
                        target: targetId.toString(),
                        label: " ",
                    }
                });
            }
        });
    }

    public show(container: HTMLElement): Core {
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
}

export function showGraph(visualizer: Visualizer, container: HTMLElement) {
    new Graph(visualizer).show(container);
}
