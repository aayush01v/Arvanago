const chart = `flowchart LR
  subgraph Procedural [Procedural Style]
    direction TB
    D[Data (Scattered)] ~~~ F[Functions (Scattered)]
  end
  subgraph OOP [Object-Oriented Style]
    direction TB
    subgraph ClassBox [Student Class]
      D2[Data] --- F2[Functions]
      A[(Database)]
      B[[Subroutine]]
      C[/Parallelogram\\]
    end
  end
  Procedural -.->|Combines into| OOP`;

function quoteMermaidLabels(chart) {
    return chart.replace(/([a-zA-Z0-9_]+)\s*\[([^"\]]+)\]/g, (match, id, text) => {
        const t = text.trim();
        if (t.startsWith('(') && t.endsWith(')')) return match;
        if (text.includes('(') || text.includes(')')) return `${id}["${text}"]`;
        return match;
    });
}

console.log(quoteMermaidLabels(chart));
