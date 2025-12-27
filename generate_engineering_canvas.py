import json
import uuid
import os
import shutil

# Configuration
CANVAS_FILE = "01 Sequence and Series.canvas"
STICKER_SOURCE_DIR = "/home/codespace/.gemini/antigravity/brain/90677294-01d4-4e87-81cf-da3dc8eab2a8"
STICKERS = {
    "infinity": "sticker_infinity_loop_1766873740702.png",
    "limit": "sticker_limit_approach_1766873693332.png",
    "trap": "sticker_warning_trap_1766873711847.png",
    "factorial": "sticker_factorial_1766873726961.png",
    "think": "sticker_strategy_think_1766874395893.png",
    "gears": "sticker_application_gears_1766874410019.png"
}

NODE_WIDTH = 400
NODE_HEIGHT = 220
X_GAP = 600  # Increased gap for better spacing
Y_GAP = 350

# Canvas Candy Colors
COLORS = {
    "def": "4",      # Green (Definitions)
    "concept": "6",  # Blue (Concepts)
    "test": "5",     # Cyan (Tests)
    "warn": "1",     # Red (Warnings/Traps)
    "tip": "3",      # Yellow (Tips)
    "header": "7"    # Purple (Headers)
}

nodes = []
edges = []

def create_id():
    return uuid.uuid4().hex[:16]

def create_node(x, y, text, width=NODE_WIDTH, height=NODE_HEIGHT, color=None):
    return {
        "id": create_id(),
        "type": "text",
        "text": text,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "color": color
    }

def create_file_node(x, y, file_path, width=200, height=200):
    return {
        "id": create_id(),
        "type": "sticker",
        "file": file_path,
        "x": x,
        "y": y,
        "width": width,
        "height": height
    }

def create_edge(from_node, to_node, label=None, from_side="right", to_side="left", color=None):
    edge = {
        "id": create_id(),
        "fromNode": from_node["id"],
        "fromSide": from_side,
        "toNode": to_node["id"],
        "toSide": to_side
    }
    if label:
        edge["label"] = label
    if color:
        edge["color"] = color
    return edge

# --- Copy Stickers ---
print("Copying stickers...")
for name, filename in STICKERS.items():
    src = os.path.join(STICKER_SOURCE_DIR, filename)
    dst = os.path.join(os.getcwd(), filename)
    if os.path.exists(src):
        shutil.copy(src, dst)
        print(f"Copied {name} sticker to {dst}")
    else:
        print(f"Warning: Sticker {name} not found at {src}")

# --- Content Generation ---

# Step 0: Strategy Guide (The Map) -> Use Gradient for "Big Picture"
strat_header = create_node(0, -100, "# Step 0: The Strategy", width=NODE_WIDTH, height=60, color=COLORS["header"])

strat_node = create_node(0, 0,
    r"""
> [!cc-header]
> Decision Tree
>
> 1. **n-th Term:** Limit $\ne 0$? -> **DIV**.
> 2. **Form:** Geometric? P-Series?
> 3. **Compare:** Similar to P-Series? -> **LCT/DCT**.
> 4. **Signs:** Alternating? -> **AST**.
> 5. **Methods:** Factorials ($n!$) -> **Ratio**. Powers ($n^n$) -> **Root**.
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["tip"]
)

sticker_tk = create_file_node(-250, 0, STICKERS["think"], 200, 200)
nodes.extend([strat_header, strat_node, sticker_tk])


# Step 1: Introduction Group -> Use Gradient for Core Definitions
intro_node = create_node(X_GAP, 0, 
    r"""
> [!cc-header]
> What is a Sequence?
>
> An **ordered list** of numbers: $a_n = f(n)$.
> * Ex: $2, 4, 6...$ ($a_n = 2n$)
> * Limit approaches $L$? Converges.
>
> cssclasses: cc-card-gradient-135deg
    """, 
    color=COLORS["def"]
)

sticker_inf = create_file_node(X_GAP + 100, -250, STICKERS["infinity"], 200, 200)

series_def_node = create_node(X_GAP, Y_GAP, 
    r"""
> [!cc-header]
> What is a Series?
>
> The **SUM** of a sequence: $\sum_{n=1}^{\infty} a_n$.
>
> Check **Partial Sums** ($S_k$):
> $$ S_k = a_1 + ... + a_k $$
> If $S_k \to L$, Series Converges.
>
> cssclasses: cc-card-gradient-135deg
    """, 
    color=COLORS["def"]
)

nodes.extend([intro_node, sticker_inf, series_def_node])
edges.append(create_edge(strat_node, intro_node, "Start"))


# Step 2: Gatekeeper Logic -> Outline Red for Warning
logic_header = create_node(X_GAP * 2, -100, "# Step 1: The Gatekeeper", width=NODE_WIDTH, height=60, color=COLORS["header"])

div_test_node = create_node(X_GAP * 2, Y_GAP,
    r"""
> [!cc-header]
> n-th Term Test
>
> $\lim_{n \to \infty} a_n$
>
> * $\neq 0 \implies$ **DIVERGES**. (Stop here!)
> * $= 0 \implies$ **INCONCLUSIVE**. (Do more tests)
>
> > [!warning] Limit = 0 does NOT mean convergence!
>
> cssclasses: cc-card-o-red
    """,
    color=COLORS["warn"]
)

sticker_tr = create_file_node(X_GAP * 2 + NODE_WIDTH - 50, Y_GAP - 100, STICKERS["trap"], 150, 150)
sticker_lim = create_file_node(X_GAP * 2 - 100, Y_GAP + 50, STICKERS["limit"], 150, 150)

nodes.extend([logic_header, div_test_node, sticker_tr, sticker_lim])
edges.append(create_edge(series_def_node, div_test_node, "Always Check First"))


# Step 3: Famous Series -> Outline Color for "Tools"
famous_header = create_node(X_GAP * 3, -100, "# Step 2: Recognized Forms", width=NODE_WIDTH, height=60, color=COLORS["header"])

geo_node = create_node(X_GAP * 3, 0,
    r"""
> [!cc-header]
> Geometric Series
> $\sum ar^n$
>
> * **Converges:** $|r| < 1$
>   * Sum $S = \frac{a}{1-r}$
> * **Diverges:** $|r| \ge 1$
>
> cssclasses: cc-card-o-blue
    """,
    color=COLORS["test"]
)

p_node = create_node(X_GAP * 3, Y_GAP * 1.5,
    r"""
> [!cc-header]
> P-Series
> $\sum \frac{1}{n^p}$
>
> * **Converges:** $p > 1$
> * **Diverges:** $p \le 1$
>
> > [!tip] Harmonic Series ($p=1$) Diverges.
>
> cssclasses: cc-card-o-blue
    """,
    color=COLORS["test"]
)

nodes.extend([famous_header, geo_node, p_node])
edges.append(create_edge(div_test_node, geo_node, "Is ratio constant?", color="2"))
edges.append(create_edge(div_test_node, p_node, "Is polynomial?", color="2"))


# Step 4: Comparison & Integral -> Outline Cyan
comp_header = create_node(X_GAP * 4, -100, "# Step 3: Comparison & Integral", width=NODE_WIDTH, height=60, color=COLORS["header"])

direct_comp_node = create_node(X_GAP * 4, 0,
    r"""
> [!cc-header]
> Direct Comparison (DCT)
>
> **Intuition:** "Bounded by"
>
> * $a_n < b_n$ (Big Conv $\implies$ Small Conv)
> * $a_n > b_n$ (Small Div $\implies$ Big Div)
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["concept"]
)

limit_comp_node = create_node(X_GAP * 4, Y_GAP,
    r"""
> [!cc-header]
> Limit Comparison (LCT)
>
> **Intuition:** "Grow at same rate"
>
> $L = \lim \frac{a_n}{b_n}$
>
> * If $0 < L < \infty$, both behave the **SAME**.
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["concept"]
)

integral_node = create_node(X_GAP * 4, Y_GAP * 2,
    r"""
> [!cc-header]
> Integral Test
>
> If $f(x)$ is:
> 1. Continuous
> 2. Positive
> 3. **Decreasing**
>
> Then $\sum a_n$ $\iff$ $\int_{1}^{\infty} f(x) dx$
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["test"]
)

nodes.extend([comp_header, direct_comp_node, limit_comp_node, integral_node])
edges.append(create_edge(geo_node, direct_comp_node))
edges.append(create_edge(p_node, limit_comp_node))
edges.append(create_edge(limit_comp_node, integral_node, "Can integrate?"))


# Step 5: Advanced (Ratio/Root/AST) -> Outline Purple/Green
calc_header = create_node(X_GAP * 5, -100, "# Step 4: Advanced Tests", width=NODE_WIDTH, height=60, color=COLORS["header"])

ratio_node = create_node(X_GAP * 5, 0,
    r"""
> [!cc-header]
> Ratio Test
> Best for $n!$ and $c^n$.
>
> $L = \lim |\frac{a_{n+1}}{a_n}|$
> * $L < 1$: Conv.
> * $L > 1$: Div.
> * $L = 1$: **Inconclusive!**
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

root_node = create_node(X_GAP * 5, Y_GAP,
    r"""
> [!cc-header]
> Root Test
> Best for $(g(n))^n$.
>
> $L = \lim \sqrt[n]{|a_n|}$
> * $L < 1$: Conv.
> * $L > 1$: Div.
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

sticker_fac = create_file_node(X_GAP * 5 + NODE_WIDTH - 50, -50, STICKERS["factorial"], 150, 150)

alt_node = create_node(X_GAP * 5, Y_GAP * 2,
    r"""
> [!cc-header]
> Alternating Series (AST)
> $\sum (-1)^n b_n$
>
> Converges if:
> 1. Decreasing ($b_{n+1} \le b_n$)
> 2. Limit is 0 ($\lim b_n = 0$)
>
> cssclasses: cc-card-o-green
    """,
    color=COLORS["test"]
)

nodes.extend([calc_header, ratio_node, root_node, alt_node, sticker_fac])
edges.append(create_edge(integral_node, ratio_node, "Factorials?"))
edges.append(create_edge(ratio_node, root_node, "Powers of n?"))
edges.append(create_edge(alt_node, root_node, "Check Absolute")) # Link logic


# Step 6: Power Series -> Gradient (Big Concept)
power_header = create_node(X_GAP * 6, -100, "# Step 5: Power Series", width=NODE_WIDTH, height=60, color=COLORS["header"])

power_def = create_node(X_GAP * 6, 0,
    r"""
> [!cc-header]
> Power Series
>
> $\sum c_n (x-a)^n$
>
> * Infinite Polynomial.
> * Find **Radius of Convergence** ($R$) using Ratio Test.
> * Converges for $|x-a| < R$.
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["concept"]
)

taylor_node = create_node(X_GAP * 6, Y_GAP,
    r"""
> [!cc-header]
> Taylor Series
>
> Represents function as series:
> $$ f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!} (x-a)^n $$
>
> **Maclaurin ($a=0$):**
> * $e^x = 1 + x + \frac{x^2}{2!} + ...$
> * $\sin x = x - \frac{x^3}{3!} + ...$
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["concept"]
)

nodes.extend([power_header, power_def, taylor_node])
edges.append(create_edge(ratio_node, power_def, "Variable x?"))
edges.append(create_edge(power_def, taylor_node, "Approximation"))

# Applications Sidebar
app_header = create_node(X_GAP * 4, Y_GAP * 3, "# Engineering Applications", width=NODE_WIDTH, height=60, color=COLORS["header"])

app_node = create_node(X_GAP * 4, Y_GAP * 3 + 100,
    r"""
> [!cc-header]
> Real-World Use
>
> 1. **Signal Processing:** Fourier Series (Decomposing waves).
> 2. **Control Systems:** Z-Transform (Discrete signals).
> 3. **Approximations:** $\sin \theta \approx \theta$ (Structural engineering).
> 4. **Finance:** Compound interest modeling.
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["tip"]
)

sticker_gr = create_file_node(X_GAP * 4 - 150, Y_GAP * 3 + 100, STICKERS["gears"], 200, 200)

nodes.extend([app_header, app_node, sticker_gr])


# Save
canvas_data = {"nodes": nodes, "edges": edges}
with open(CANVAS_FILE, "w") as f:
    json.dump(canvas_data, f, indent=4)

print(f"Generated {CANVAS_FILE} with {len(nodes)} nodes and {len(edges)} edges.")
