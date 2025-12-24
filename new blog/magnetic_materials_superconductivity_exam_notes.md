# Magnetic Materials & Superconductivity — Exam Notes

_A concise, exam-oriented summary for B.Tech (1st year). Includes definitions, key formulas, memory tips, comparison tables, and exam lines._

---

## 1. Basic definitions & relations

- **Magnetization (M):** magnetic moment per unit volume.
- **Magnetic field (B):** \(B = \mu_0 (H + M)\).
- **Magnetic susceptibility (\(\chi\)):** \(M = \chi H\).
- **Permeability (\(\mu\)):** \(\mu = \mu_0 (1+\chi)\).

---

## 2. Types of magnetic behaviour (short and exam-friendly)

### Diamagnetic
- **Physical idea:** No permanent moments; induced moments oppose applied field.
- **Properties:** Weakly repelled; susceptibility \(\chi < 0\); temperature independent.
- **Examples:** Cu, Bi, Au, water.
- **Exam line:** Diamagnetic materials are weakly repelled by magnetic fields due to induced magnetic moments opposing the applied field.
- **Memory:** *Dia = Die away from field*.

### Paramagnetic
- **Physical idea:** Unpaired electrons; moments tend to align with field but thermal agitation randomizes them.
- **Properties:** Small positive \(\chi\); magnetization disappears when field removed; follows Curie’s law \(\chi = C/T\).
- **Examples:** Al, Pt, O₂.
- **Exam line:** Paramagnetic materials show weak attraction to applied magnetic fields and follow Curie’s law.
- **Memory:** *Para = Partial alignment*.

### Ferromagnetic
- **Physical idea:** Strong exchange interaction leads to spontaneous parallel alignment (domains).
- **Properties:** Large positive \(\chi\); retain magnetization (permanent magnets); show hysteresis; become paramagnetic above Curie temperature \(T_c\).
- **Examples:** Fe, Co, Ni.
- **Exam line:** Ferromagnetism arises due to parallel alignment of magnetic moments in domains.
- **Memory:** *Ferro = Forever magnet*.

### Ferrimagnetic
- **Physical idea:** Antiparallel alignment of unequal moments → net magnetization.
- **Properties:** Net magnetization unlike antiferromagnetism; used at higher frequencies.
- **Examples:** Ferrites (e.g., Fe₃O₄).
- **Exam line:** Ferrimagnetism results from antiparallel magnetic moments of unequal magnitude producing a net magnetization.
- **Memory:** *Ferri = Fighting but unequal*.

---

## 3. Ferrites (practical magnetic ceramics)

- **Composition:** Iron oxide + other metal oxides (ceramic).
- **Properties:** High magnetic permeability; very high electrical resistivity; low eddy current losses.
- **Types:** Soft ferrites (Mn–Zn) for low frequencies; hard ferrites (Ba-ferrite) for permanent magnets.
- **Applications:** Transformer/inductor cores, EMI suppression, microwave devices.
- **Exam line:** Ferrites are ferrimagnetic materials with high resistivity and low eddy current losses.

---

## 4. Hysteresis loop (B–H curve)

- **Definition:** Lag of magnetization (B) behind magnetizing force (H).

**Key terms:**
- **Saturation (\(B_s\)):** maximum flux density.
- **Retentivity (Remanence, \(B_r\)):** residual flux when H → 0.
- **Coercivity (\(H_c\)):** reverse H needed to reduce B to zero.
- **Hysteresis loss:** energy loss per cycle ∝ area of loop.

**Soft vs Hard magnetic materials**

| Property | Soft | Hard |
|---|---:|---:|
| Coercivity | Low | High |
| Loop area | Small | Large |
| Use | Transformer cores, electromagnets | Permanent magnets |

**Exam point:** Area of hysteresis loop = energy loss per unit volume per cycle.

---

## 5. Magnetic anisotropy

- **Definition:** Magnetic properties depend on direction in a crystal or sample.
- **Types:** Magnetocrystalline, shape anisotropy, stress anisotropy.
- **Consequences:** Existence of easy and hard axes; determines coercivity and stability of magnetization.
- **Exam line:** Magnetic anisotropy causes magnetization to prefer certain crystallographic directions.

---

## 6. Quick comparison table

| Type | Susceptibility (χ) | Response to field | Retains magnetism? |
|---|---:|---|---:|
| Diamagnetic | Negative | Repelled | No |
| Paramagnetic | Small positive | Weak attraction | No |
| Ferromagnetic | Large positive | Strong attraction | Yes |
| Ferrimagnetic | Positive (moderate) | Moderate | Yes |

---

# Superconductivity — Exam Notes

## 1. Basic definition

- **Superconductivity:** Phenomenon where materials below a critical temperature \(T_c\) exhibit **zero electrical resistance** and **perfect diamagnetism**.
- **Macroscopic quantum phenomenon** — cannot be fully explained classically.
- **Common examples:** Hg, Pb, Nb (low-\(T_c\)); YBCO, BSCCO (high-\(T_c\)).

**Exam line:** Superconductivity is the property of certain materials to show zero resistivity and perfect diamagnetism below a critical temperature.

---

## 2. Superconductors as ideal diamagnetic materials

- **Perfect diamagnetism:** magnetic susceptibility \(\chi = -1\).
- **Field inside superconductor:** \(B = 0\) (in Meissner state).
- **Difference from perfect conductor:** A perfect conductor (classical) would trap flux if cooled in field; a superconductor expels flux when it transitions (Meissner effect).

**Exam line:** Superconductors behave as ideal diamagnets because they expel magnetic flux completely from their interior.

---

## 3. Signatures of superconducting state

1. **Zero electrical resistance** (measured by abrupt drop in resistivity to zero at \(T_c\)).
2. **Meissner effect:** complete expulsion of magnetic flux when cooled below \(T_c\).
3. **Critical parameters:** \(T_c\) (critical temperature), \(H_c\) (critical field), \(I_c\) (critical current). Exceeding any destroys superconductivity.

**Exam tip:** Always mention all three critical parameters when asked about conditions for superconductivity.

---

## 4. Meissner effect

- **Definition:** Expulsion of magnetic field from the interior of a material when it becomes superconducting, independent of magnetic history.
- **Physical implication:** Superconductor is a distinct thermodynamic phase—not just a perfect conductor.
- **Result:** Magnetic field decays exponentially from surface into interior (penetration depth \(\lambda\)).

**Exam line:** Meissner effect is the expulsion of magnetic field lines from a superconductor when cooled below its \(T_c\).

---

## 5. Type-I vs Type-II superconductors

### Type-I
- **Single critical field:** \(H_c\).
- **Behaviour:** Abrupt transition between superconducting and normal state; full Meissner effect below \(H_c\).
- **Examples:** Pure elemental superconductors (Hg, Pb).

### Type-II
- **Two critical fields:** \(H_{c1}\) and \(H_{c2}\).
- **Behaviour:** For \(H < H_{c1}\) full Meissner state; for \(H_{c1} < H < H_{c2}\) mixed (vortex) state with quantized flux lines (Abrikosov vortices); for \(H > H_{c2}\) normal.
- **Examples:** NbTi, Nb₃Sn, high-\(T_c\) cuprates (YBCO).

**Comparison table**

| Property | Type I | Type II |
|---|---:|---:|
| Critical fields | One (\(H_c\)) | Two (\(H_{c1}, H_{c2}\)) |
| Flux penetration | No | Partial (vortices) |
| Practical use | Limited | Widely used in magnets |

---

## 6. London equations (phenomenological)

**Goal:** Explain zero resistance and Meissner effect phenomenologically.

- **First London equation** (relates electric field & current acceleration):

\[\frac{d\vec{J}}{dt} = \frac{n_s e^2}{m} \vec{E} \]

This indicates that superconducting current accelerates under \(\vec{E}\) with no resistive damping (hence persistent currents).

- **Second London equation** (relates current curl to magnetic field):

\[ \nabla \times \vec{J} = -\frac{n_s e^2}{m} \vec{B} \]

Combining with Maxwell's equations gives an equation showing that magnetic field decays exponentially inside superconductor with characteristic **London penetration depth** \(\lambda\):

\[ B(x) = B_0 e^{-x/\lambda} \]

- **London penetration depth:** \(\lambda = \sqrt{\dfrac{m}{\mu_0 n_s e^2}}\)

**Exam line:** London equations provide a phenomenological explanation of persistent currents and the Meissner effect; they predict exponential decay of magnetic field with penetration depth \(\lambda\).

---

## 7. Key formulas & quick references

- \(B = \mu_0(H + M)\)
- Curie’s law for paramagnets: \(\chi = C/T\)
- London penetration depth: \(\lambda = \sqrt{\dfrac{m}{\mu_0 n_s e^2}}\)
- London equations (first & second) as above.

---

## 8. Important short-answer lines for exams

- **Define diamagnetism/paramagnetism/ferromagnetism/ferrimagnetism.**
- **State Meissner effect.**
- **Give definitions of retentivity and coercivity.**
- **Write first and second London equations and define penetration depth.**
- **Differentiate Type I and Type II superconductors.**

---

## 9. Practice questions (suggested)

1. Define and distinguish diamagnetic, paramagnetic, ferromagnetic and ferrimagnetic materials. (6 marks)
2. Explain the hysteresis loop and name two uses of soft magnetic materials. (5 marks)
3. State and explain the Meissner effect. How does it differ from behaviour of a perfect conductor? (5 marks)
4. Write down London’s equations and derive the expression for penetration depth (\(\lambda\)). (8 marks)
5. Explain Type-II superconductors and the mixed state. Sketch qualitative B vs H for Type-II.

---

## 10. Quick revision checklist (1-minute scan)

- [ ] Know \(B = \mu_0(H+M)\)
- [ ] Write Curie’s law
- [ ] Draw and label hysteresis loop (\(B_s, B_r, H_c\))
- [ ] State Meissner effect and \(\chi = -1\) for superconductors
- [ ] Write London equations and explain \(\lambda\)
- [ ] Compare Type I and Type II

---

### Next steps (you can ask me to do any of the following)
- Convert these notes into a one-page printable revision sheet.
- Make a list of probable exam questions & short answers.
- Add derivations and numerical examples (e.g., compute \(\lambda\) for given \(n_s\)).
- Create flashcards from the key lines.


*End of canvas notes.*

