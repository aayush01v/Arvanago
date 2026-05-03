import json
import uuid
import os
import shutil
import base64
import requests # Assuming requests is available, usually is.

# Configuration
CANVAS_FILE = "01 Sequence and Series.canvas"
STICKER_SOURCE_DIR = "/home/codespace/.gemini/antigravity/brain/90677294-01d4-4e87-81cf-da3dc8eab2a8"
# This key was found in services/imgbbService.ts
IMGBB_API_KEY = "9dad115cc5d046905201e16e6b20f4ab" 

STICKERS = {
    "infinity": "sticker_infinity_loop_1766873740702.png",
    "limit": "sticker_limit_approach_1766873693332.png",
    "trap": "sticker_warning_trap_1766873711847.png",
    "factorial": "sticker_factorial_1766873726961.png",
    "think": "sticker_strategy_think_1766874395893.png",
    "gears": "sticker_application_gears_1766874410019.png",
    "cup": "sticker_analogy_cup_1766875378874.png"
}

# START: Colors & Sizes
NODE_WIDTH = 400
NODE_HEIGHT = 220
X_GAP = 700
Y_GAP = 400
COLORS = {
    "def": "4", "concept": "6", "test": "5", "warn": "1", "tip": "3", "header": "7"
}
# END: Colors & Sizes

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

def create_file_node(x, y, url, width=200, height=200):
    # Note: We replaced 'file' with 'url' param for clarity, but canvas usually expects 'file' for path
    # However, since we use type="sticker", our renderer checks node.file || node.url.
    # We will use 'file' field to store the URL to be consistent with existing renderer logic which handles http in resolveFileSrc.
    return {
        "id": create_id(),
        "type": "sticker",
        "file": url, # Works because CanvasRenderer checks if startswith http
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

def upload_to_imgbb(file_path):
    print(f"Uploading {os.path.basename(file_path)}...")
    url = "https://api.imgbb.com/1/upload"
    try:
        with open(file_path, "rb") as file:
            payload = {
                "key": IMGBB_API_KEY,
                "image": base64.b64encode(file.read()),
            }
            res = requests.post(url, payload)
            print(f"Status: {res.status_code}, Response: {res.text[:200]}") # Debug print
            if res.status_code == 200:
                data = res.json()
                if data["success"]:
                    return data["data"]["url"]
                else:
                    print(f"ImgBB API Error: {data}")
            else:
                print(f"HTTP Error: {res.status_code}")
    except Exception as e:
        print(f"Failed to upload {file_path}: {e}")
    return None

# --- Upload Stickers first ---
print("Uploading stickers to ImgBB...")
STICKER_URLS = {}

for name, filename in STICKERS.items():
    # Check current dir first, then source dir
    local_path = os.path.join(os.getcwd(), filename)
    source_path = os.path.join(STICKER_SOURCE_DIR, filename)
    
    target_file = local_path if os.path.exists(local_path) else source_path
    
    if os.path.exists(target_file):
        url = upload_to_imgbb(target_file)
        if url:
            STICKER_URLS[name] = url
            print(f"Uploaded {name} -> {url}")
        else:
            print(f"Error uploading {name}, using local fallback.")
            STICKER_URLS[name] = filename # Fallback
    else:
        print(f"Warning: Sticker {name} not found at {target_file}")
        STICKER_URLS[name] = filename

# --- Content Generation ---

# Step 0: Strategy Guide (The Map) -> Gradient
strat_header = create_node(0, -100, "# Step 0: The Grand Strategy", width=NODE_WIDTH, height=60, color=COLORS["header"])

strat_node = create_node(0, 0,
    r"""
> [!cc-header]
> Decision Tree
>
> 1. **Check First:** Limit $\ne 0$? -> **DIV**.
> 2. **Check Form:** Geometric? P-Series?
> 3. **Compare:** Similar to simple form? -> **LCT/DCT**.
> 4. **Signs:** Alternating? -> **AST/Leibniz**.
> 5. **Algebra:** Factors/Products? -> **Ratio**. Powers? -> **Root**.
> 6. **Stuck?** Ratio=1? -> **Raabe's/Log**.
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["tip"]
)

sticker_tk = create_file_node(-250, 0, STICKER_URLS["think"], 200, 200)
nodes.extend([strat_header, strat_node, sticker_tk])


# Step 1: Sequences (The Foundation)
seq_header = create_node(X_GAP, -100, "# Step 1: Sequences", width=NODE_WIDTH, height=60, color=COLORS["header"])

seq_def_node = create_node(X_GAP, 0, 
    r"""
> [!cc-header]
> What is a Sequence?
>
> An **ordered list** of numbers: $a_n$.
>
> **Convergence:**
> * Value settles at $L$.
> * Example: $1/n \to 0$.
>
> **Divergence:**
> 1. **Unbounded:** goes to $\infty$. ($n^2$)
> 2. **Oscillating:** jumps forever. ($(-1)^n$)
>
> cssclasses: cc-card-gradient-135deg
    """, 
    color=COLORS["def"]
)

sticker_inf = create_file_node(X_GAP + 100, -250, STICKER_URLS["infinity"], 200, 200)

nodes.extend([seq_header, seq_def_node, sticker_inf])
edges.append(create_edge(strat_node, seq_def_node, "Start"))


# Step 2: The Transition (List vs Sum) & Cup Analogy
trans_header = create_node(X_GAP * 2, -100, "# Step 2: The Transition", width=NODE_WIDTH, height=60, color=COLORS["header"])

compare_node = create_node(X_GAP * 2, 0,
    r"""
> [!cc-header]
> List vs. Sum
>
> | Feature | Sequence $\{a_n\}$ | Series $\sum a_n$ |
> | :--- | :--- | :--- |
> | **Concept** | A **List** | A **Total** |
> | **Op** | Commas | Plus Signs |
> | **Goal** | Where terms go | Where total goes |
>
> cssclasses: cc-card-o-blue
    """,
    color=COLORS["concept"]
)

cup_node = create_node(X_GAP * 2, Y_GAP,
    r"""
> [!cc-header]
> The 'Cup Filling' Analogy
>
> How can infinite additions be finite?
>
> * Imagine filling a cup.
> * Add 1/2, then 1/4, then 1/8...
> * You pour forever, but you **never overflow**.
> * The **Limit** is the full cup.
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["concept"]
)

sticker_cp = create_file_node(X_GAP * 2 + 150, Y_GAP - 150, STICKER_URLS["cup"], 200, 200)

nodes.extend([trans_header, compare_node, cup_node, sticker_cp])
edges.append(create_edge(seq_def_node, compare_node))
edges.append(create_edge(compare_node, cup_node, "Partial Sums"))


# Step 3: The Gatekeeper
gate_header = create_node(X_GAP * 3, -100, "# Step 3: The Gatekeeper", width=NODE_WIDTH, height=60, color=COLORS["header"])

div_test_node = create_node(X_GAP * 3, 0,
    r"""
> [!cc-header]
> n-th Term Test
>
> Check the **Limit of Sequence** ($a_n$).
>
> * If $\lim a_n \neq 0$: The Total **Diverges**.
> * If $\lim a_n = 0$: **INCONCLUSIVE**.
>
> > [!warning] Terms going to 0 $\neq$ Convergence!
> > (See Harmonic Series)
>
> cssclasses: cc-card-o-red
    """,
    color=COLORS["warn"]
)

sticker_tr = create_file_node(X_GAP * 3 + NODE_WIDTH - 50, -100, STICKER_URLS["trap"], 150, 150)
nodes.extend([gate_header, div_test_node, sticker_tr])
edges.append(create_edge(compare_node, div_test_node, "Check Required"))


# Step 4: Known Forms
form_header = create_node(X_GAP * 4, -100, "# Step 4: Known Forms", width=NODE_WIDTH, height=60, color=COLORS["header"])

geo_node = create_node(X_GAP * 4, 0,
    r"""
> [!cc-header]
> Geometric Series
> $\sum ar^n$
>
> * **Converges:** $|r| < 1$
>   * $Sum = \frac{a}{1-r}$
> * **Diverges:** $|r| \ge 1$
>
> cssclasses: cc-card-o-blue
    """,
    color=COLORS["test"]
)

p_node = create_node(X_GAP * 4, Y_GAP,
    r"""
> [!cc-header]
> P-Series
> $\sum \frac{1}{n^p}$
>
> * **Converges:** $p > 1$
> * **Diverges:** $p \le 1$
>
> > [!tip] Harmonic ($p=1$) Diverges.
>
> cssclasses: cc-card-o-blue
    """,
    color=COLORS["test"]
)

nodes.extend([form_header, geo_node, p_node])
edges.append(create_edge(div_test_node, geo_node, "Constant Ratio?"))
edges.append(create_edge(div_test_node, p_node, "Polynomial?"))


# Step 5: Comparison & Integral
comp_header = create_node(X_GAP * 5, -100, "# Step 5: Compare", width=NODE_WIDTH, height=60, color=COLORS["header"])

direct_comp_node = create_node(X_GAP * 5, 0,
    r"""
> [!cc-header]
> Direct Comparison (DCT)
>
> * Smaller than Convergent? **Conv.**
> * Bigger than Divergent? **Div.**
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["concept"]
)

limit_comp_node = create_node(X_GAP * 5, Y_GAP,
    r"""
> [!cc-header]
> Limit Comparison (LCT)
>
> $L = \lim \frac{a_n}{b_n}$
>
> * $0 < L < \infty$: **Behave Identically**.
> * Use when terms look "messy" but resemble P-Series.
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["concept"]
)

integral_node = create_node(X_GAP * 5, Y_GAP * 2,
    r"""
> [!cc-header]
> Integral Test
>
> If $f(x)$ is continuous, positive, **decreasing**:
>
> $\sum a_n$ behaves like $\int_{1}^{\infty} f(x) dx$
>
> cssclasses: cc-card-o-cyan
    """,
    color=COLORS["test"]
)

nodes.extend([comp_header, direct_comp_node, limit_comp_node, integral_node])
edges.append(create_edge(geo_node, direct_comp_node))
edges.append(create_edge(p_node, limit_comp_node))
edges.append(create_edge(limit_comp_node, integral_node))


# Step 6: Advanced Toolkit (Ratio, Root, Alternating)
adv_header = create_node(X_GAP * 6, -100, "# Step 6: Advanced Tools", width=NODE_WIDTH, height=60, color=COLORS["header"])

ratio_node = create_node(X_GAP * 6, 0,
    r"""
> [!cc-header]
> Ratio Test
> Best for $n!$ / $c^n$.
>
> $L = \lim |\frac{a_{n+1}}{a_n}|$
> * $L < 1$: Conv.
> * $L > 1$: Div.
> * $L = 1$: **FAIL** (Raabe needed).
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

root_node = create_node(X_GAP * 6, Y_GAP,
    r"""
> [!cc-header]
> Root Test
> Best for exponents $(...)^n$.
>
> $L = \lim \sqrt[n]{|a_n|}$
> * $L < 1$: Conv.
> * $L > 1$: Div.
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

leib_node = create_node(X_GAP * 6, Y_GAP * 2,
    r"""
> [!cc-header]
> Gold Standard: Leibniz
> (Alternating Series Test)
>
> $\sum (-1)^n b_n$ Converges if:
> 1. Terms decrease ($b_{n+1} \le b_n$)
> 2. Limit is 0 ($\lim b_n = 0$)
>
> cssclasses: cc-card-o-green
    """,
    color=COLORS["test"]
)

sticker_fac = create_file_node(X_GAP * 6 + NODE_WIDTH - 50, -50, STICKER_URLS["factorial"], 150, 150)

nodes.extend([adv_header, ratio_node, root_node, leib_node, sticker_fac])
edges.append(create_edge(integral_node, ratio_node, "Factorials?"))
edges.append(create_edge(ratio_node, root_node, "Exponents?"))
edges.append(create_edge(ratio_node, leib_node, "Alternating?"))


# Step 7: The Last Resort (Raabe & Log)
expert_header = create_node(X_GAP * 7, -100, "# Step 7: The Last Resort", width=NODE_WIDTH, height=60, color=COLORS["header"])

raabe_node = create_node(X_GAP * 7, 0,
    r"""
> [!cc-header]
> Raabe's Test
> Use when **Ratio Test = 1**.
>
> $L = \lim n(1 - |\frac{a_{n+1}}{a_n}|)$
>
> * $L > 1$: Conv. (Big $L$ is good)
> * $L < 1$: Div.
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

log_node = create_node(X_GAP * 7, Y_GAP,
    r"""
> [!cc-header]
> Logarithmic Test
> Use when Raabe is messy.
>
> $L = \lim \frac{\ln(1/|a_n|)}{\ln n}$
>
> * $L > 1$: Conv.
> * $L < 1$: Div.
>
> cssclasses: cc-card-o-purple
    """,
    color=COLORS["test"]
)

nodes.extend([expert_header, raabe_node, log_node])
edges.append(create_edge(ratio_node, raabe_node, "If Limit=1", color="1"))
edges.append(create_edge(raabe_node, log_node, "If messy", color="1"))


# Step 8: Power Series (Boss Level)
power_header = create_node(X_GAP * 8, -100, "# Step 8: Power Series", width=NODE_WIDTH, height=60, color=COLORS["header"])

power_def = create_node(X_GAP * 8, 0,
    r"""
> [!cc-header]
> Power Series
>
> $\sum c_n (x-a)^n$
>
> * Finds **Radius of Convergence** ($R$).
> * "Where is the function valid?"
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["concept"]
)

taylor_node = create_node(X_GAP * 8, Y_GAP,
    r"""
> [!cc-header]
> Taylor Series
>
> $f(x) = \sum \frac{f^{(n)}(a)}{n!} (x-a)^n$
>
> * $e^x = 1 + x + x^2/2! + ...$
> * $\sin x = x - x^3/3! + ...$
> * $\cos x = 1 - x^2/2! + ...$
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["concept"]
)

nodes.extend([power_header, power_def, taylor_node])
edges.append(create_edge(raabe_node, power_def))
edges.append(create_edge(power_def, taylor_node))


# Applications Sidebar
app_header = create_node(X_GAP * 5, Y_GAP * 3, "# Why this matters?", width=NODE_WIDTH, height=60, color=COLORS["header"])

app_node = create_node(X_GAP * 5, Y_GAP * 3 + 100,
    r"""
> [!cc-header]
> Engineering Applications
>
> 1. **Fourier Series:** Breaking waves into frequencies.
> 2. **Z-Transform:** Digital Control Systems.
> 3. **Taylor Approx:** Physics ($\sin x \approx x$).
> 4. **Finance:** Compound Interest ($e^x$).
>
> cssclasses: cc-card-gradient-135deg
    """,
    color=COLORS["tip"]
)

sticker_gr = create_file_node(X_GAP * 5 - 150, Y_GAP * 3 + 100, STICKER_URLS["gears"], 200, 200)

nodes.extend([app_header, app_node, sticker_gr])


# Save
canvas_data = {"nodes": nodes, "edges": edges}
with open(CANVAS_FILE, "w") as f:
    json.dump(canvas_data, f, indent=4)

print(f"Generated {CANVAS_FILE} with {len(nodes)} nodes and {len(edges)} edges.")
