import mermaid from 'mermaid';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="mermaid"></div></body></html>`);
global.window = dom.window;
global.document = dom.window.document;

mermaid.initialize({
    startOnLoad: false,
    theme: 'default'
});

const chart = `flowchart LR
  subgraph Procedural [Procedural Style]
    direction TB
    D[Data (Scattered)] ~~~ F[Functions (Scattered)]
  end
  subgraph OOP [Object-Oriented Style]
    direction TB
    subgraph ClassBox [Student Class]
      D2[Data] --- F2[Functions]
    end
  end
  Procedural -.->|Combines into| OOP`;

async function test() {
    try {
        await mermaid.render('mermaid', chart);
        console.log("SUCCESS!");
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

test();
