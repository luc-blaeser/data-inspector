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

    this.motokoHeap = null;
    try {
      const canisterId = document.getElementById('canisterId').value;
      const blob = await inspectData(canisterId, process.env.DFX_NETWORK);
      console.log(`Downloaded heap image of ${blob.length} bytes from ${canisterId}`);
      this.motokoHeap = DataParser.parse(blob);
      console.log(stringify(this.motokoHeap));
      this.output = "";
    } catch (error) {
      if (error.message.includes("Unauthorized call of __motoko_inspect_data")) {
        this.output = "Missing authorization: Only canister controller are allowed to use data inspection";
      } else {
        this.output = error.message;
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
        <h1>Data Inspector</h1>
        <form action="#">
          <div class="form-block">
            <input list="options" id="canisterId" placeholder="Canister:">
            <datalist id="options">
              <option value="${process.env.CANISTER_ID_BACKEND1}">
              <option value="${process.env.CANISTER_ID_BACKEND2}">
            </datalist>
          </div>
          <div class="form-block">
              <label>
                  <input type="radio" name="view" value="compact" checked>
                  Compact View
              </label>
              <label>
                  <input type="radio" name="view" value="detailed">
                  Detailed View
              </label>
          </div>
          <div class="form-block">
            <button type="submit">Inspect</button>
          </div>
        </form>
        <section id="graph"></section>
        <section id="output">${this.output}</section>
      </main>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);
  }
}

export default App;
