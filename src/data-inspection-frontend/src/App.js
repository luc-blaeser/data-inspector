import { html, render } from 'lit-html';
import { data_inspection_backend } from 'declarations/data-inspection-backend';
import { canisterId } from '../../declarations/data-inspection-backend';
import { inspectData } from './DataInspection';
import { DataParser } from './DataParser';
import { CytospaceConverter } from './Cytoscape';
import { stringify } from './Utilities';

class App {
  constructor() {
    this.#render();
  }

  #handleSubmit = async (e) => {
    e.preventDefault();


    let motokoHeap = null;
    try {
      const blob = await inspectData(canisterId, process.env.DFX_NETWORK);
      console.log("Downloaded heap image of " + blob.length + " bytes");
      motokoHeap = DataParser.parse(blob);
      this.output = stringify(motokoHeap);
    } catch (error) {
      if (error.message.includes("Unauthorized call of __motoko_inspect_data")) {
        this.output = "Missing authorization: Only canister controller are allowed to use data inspection";
      } else {
        this.output = error.message;
      }
    }

    try {
      if (motokoHeap != null) {
        const container = document.getElementById('graph');
        const converter = new CytospaceConverter(motokoHeap);
        converter.renderCytoscape(container);
      }
    } catch (error) {
      console.error(error);
    }

    await data_inspection_backend.change();
    this.#render();
  };

  #render() {
    let body = html`
      <main>
        <form action="#">
          <button type="submit">Inspect</button>
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
