import { html, render } from 'lit-html';
import { inspectData } from './DataInspection';
import { DataParser } from './DataParser';
import { showGraph } from './visualization/CytoscapeGraph';
import { stringify } from './Utilities';
import { DetailedVisualizer } from './visualization/DetailedVisualizer';
import { CompactVisualizer } from './visualization/CompactVisualizer';

class App {
  constructor() {
    this.#render();
  }

  #handleSubmit = async (e) => {
    e.preventDefault();

    this.error = "";
    this.motokoHeap = null;
    try {
      const canisterId = document.getElementById('canisterId').value;
      if (canisterId == "") {
        throw new Error("Invalid canister Id");
      }
      const blob = await inspectData(canisterId, process.env.DFX_NETWORK);
      console.log(`Downloaded heap image of ${blob.length} bytes from ${canisterId}`);
      this.motokoHeap = DataParser.parse(blob);
      console.log(stringify(this.motokoHeap));
    } catch (error) {
      if (error.message.includes("Unauthorized call of __motoko_inspect_data")) {
        this.error = "Missing authorization: Only canister controller are allowed to use data inspection";
      } else {
        this.error = error.message;
      }
    }
    
    this.displayGraph();
    this.#render();
  };

  displayGraph() {
    try {
      if (this.motokoHeap != null) {
        let radioButton = document.querySelector('input[name="view"][value="compact"]');
        const isCompact = radioButton.checked;

        const visualizer = isCompact ? new CompactVisualizer(this.motokoHeap) : new DetailedVisualizer(this.motokoHeap);
        const container = document.getElementById('graph');
        showGraph(visualizer, container);
      }
    } catch (error) {
      console.error(error);
    }
  }

  #render() {
    let body = html`
      <main>
        <h1>Motoko Data Inspector</h1>
        <div id="panel">
          <section id="control">
            <div>
              <input list="options" id="canisterId" placeholder="Canister ID">
              <datalist id="options">
                <option value="${process.env.CANISTER_ID_BACKEND1}">
                <option value="${process.env.CANISTER_ID_BACKEND2}">
                <option value="${process.env.CANISTER_ID_BACKEND3}">
              </datalist>
            </div>
            <div>
                <label>
                    <input type="radio" name="view" value="compact" checked>
                    Compact View
                </label>
                <label>
                    <input type="radio" name="view" value="detailed">
                    Detailed View
                </label>
            </div>
            <div>
              <form action="#">
              <button type="submit">Inspect</button>
            </form>
          </section>
          <section id="error">${this.error}</section>
          <section id="graph"></section>
        </div>
      </main>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);
  }
}

export default App;
