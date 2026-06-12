import mermaid from 'mermaid';

const chart = `flowchart LR
  subgraph Procedural["Procedural Style"]
    direction TB
    D["Data (Scattered)"] ~~~ F["Functions (Scattered)"]
  end
  subgraph OOP["Object-Oriented Style"]
    direction TB
    subgraph ClassBox["Student Class"]
      D2["Data"] --- F2["Functions"]
    end
  end
  Procedural -.->|Combines into| OOP`;

async function test() {
    try {
        await mermaid.parse(chart);
        console.log("PARSE SUCCESS!");
    } catch (e) {
        console.error("PARSE ERROR:", e.message);
    }
}
test();
