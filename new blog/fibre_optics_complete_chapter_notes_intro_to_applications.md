# Fibre Optics — Complete Chapter Notes

> **Level:** B.Tech 1st year / Engineering Physics — exam-oriented, concise, and formula-ready.

---

## Contents
1. Introduction to Optical Fibre
2. Structure and Principle (Total Internal Reflection)
3. Acceptance Angle
4. Numerical Aperture (NA)
5. Normalized Frequency (V‑number)
6. Modes of Propagation (Single‑mode / Multimode)
7. Dispersion and Pulse Broadening
   - Material dispersion
   - Modal dispersion (brief)
   - Waveguide dispersion (brief)
8. Fibre Connectors, Splices, and Couplers
9. Applications of Optical Fibres
10. Quick Formula Sheet
11. Short (5/10‑mark) Answers — Ready to Copy in Exams
12. Solved Numericals (2 examples)
13. Exam Tips & Revision Checklist

---

## 1. Introduction to Optical Fibre

An **optical fibre** is a thin, flexible dielectric waveguide that transmits light by repeated **Total Internal Reflection (TIR)**. It is used to carry optical signals over long distances with low attenuation and very high bandwidth.

**Key components:**
- **Core**: Central region of radius \(a\), refractive index \(n_1\).
- **Cladding**: Surrounds the core, refractive index \(n_2 < n_1\).
- **Jacket/Coating**: Mechanical protection.

_Practical note:_ Fibres are typically made of silica glass (SiO₂) with carefully controlled refractive indices.

---

## 2. Structure and Principle (Total Internal Reflection)

**Total Internal Reflection (TIR)** occurs when light hits an interface from a denser medium to a rarer medium at an angle greater than the critical angle \(\theta_c\). For core–cladding interface:

\[ \sin\theta_c = \frac{n_2}{n_1} \quad (n_1>n_2) \]

Light rays inside the core that strike the core–cladding boundary at angles \(>\theta_c\) are reflected back — this confines light to the core and allows guided propagation.

---

## 3. Acceptance Angle

**Acceptance angle** \(\theta_a\) is the maximum angle (with respect to the fibre axis) at which an external ray can enter the fibre and still be guided.

Light entering within a cone of half‑angle \(\theta_a\) (the acceptance cone) will be guided.

Relationship with Numerical Aperture:

\[ \theta_a = \sin^{-1}(\text{NA}) \]

---

## 4. Numerical Aperture (NA)

**Definition:** NA quantifies the light‑gathering ability of a fibre.

\[ \boxed{\text{NA} = \sqrt{n_1^2 - n_2^2}} \]

**Alternate expression** (for rays in air, \(n_{air}\approx 1\)) relating input angle \(\theta_a\) to NA:

\[ \text{NA} = n_{\text{air}}\sin\theta_a \approx \sin\theta_a \]

**Physical meaning:** Larger NA → larger acceptance angle → easier coupling of light into the fibre.

---

## 5. Normalized Frequency (V‑number)

**Definition:** The normalized frequency (also called the V‑number) determines the number of guided modes supported by the fibre.

\[ \boxed{V = \frac{2\pi a}{\lambda}\,\text{NA}} \]

Where:
- \(a\) = core radius
- \(\lambda\) = wavelength in vacuum
- NA = numerical aperture

**Mode condition (step-index fibre):**
- \(V < 2.405\) → single‑mode operation (only the fundamental \(\text{LP}_{01}\) mode)
- \(V > 2.405\) → multimode operation (multiple guided modes)

---

## 6. Modes of Propagation

**Mode:** A specific field distribution (electromagnetic solution) that satisfies boundary conditions for the fibre.

**Types:**
- **Single‑mode fibre (SMF):** Core small enough (or \(\lambda\) large enough) so only fundamental mode propagates. Low modal dispersion; used for long‑haul communication.
- **Multimode fibre (MMF):** Larger core supports many modes. Simpler coupling from LEDs/VCSELs; used for short distances (LANs, data centres).

**Mode categories (step‑index):** LP modes (linearly polarized approximate modes): \(\text{LP}_{01},\ \text{LP}_{11},\ \text{LP}_{21},\,...\)

_Practical note:_ Graded‑index multimode fibres reduce modal dispersion by making group velocities of different modes more similar.

---

## 7. Dispersion and Pulse Broadening

**Dispersion** causes an optical pulse to spread temporally as it propagates, limiting the bit‑rate and distance.

Total pulse broadening is often approximated by combining contributions (not strictly additive, but commonly used for estimates):
- **Material dispersion (chromatic dispersion)**
- **Modal dispersion** (only in multimode fibres)
- **Waveguide dispersion** (geometry dependent)

### Material Dispersion

- Caused by wavelength dependence of the refractive index \(n(\lambda)\).
- Different spectral components (within the source linewidth) travel at different group velocities.

Group delay per unit length: \(\tau_g(\lambda)=\dfrac{n_g(\lambda)}{c}\), where group index \(n_g=n - \lambda\dfrac{dn}{d\lambda}\).

Approximate pulse spread due to material dispersion for a spectral width \(\Delta\lambda\) over length \(L\):

\[ \Delta\tau_{\text{mat}} \approx L \cdot \left| \frac{d}{d\lambda}\left(\frac{n_g}{c}\right)\right| \Delta\lambda \approx L \cdot \left| \frac{d^2 n}{d\lambda^2} \right| \Delta\lambda \]

(Exact forms use dispersion parameter \(D(\lambda)\) measured in ps/(nm·km): \(\Delta\tau = D\,\Delta\lambda\,L\).)

### Modal Dispersion

- Present in multimode fibres: different modes follow different path lengths → different transit times.
- For step‑index multimode fibre, maximum modal delay spread approx:

\[ \Delta\tau_{\text{modal}} \approx \frac{n_1 L}{c} \left(1 - \frac{n_2}{n_1}\right) \approx \frac{n_1 L}{c} \cdot \frac{\text{NA}^2}{2 n_1^2} \approx \frac{L\,\text{NA}^2}{2c n_1} \]

(Graded‑index fibres are designed to reduce modal dispersion.)

### Waveguide Dispersion

- Comes from the frequency dependence of the mode confinement (distribution of field between core and cladding changes with \(\lambda\)).
- Important for single‑mode fibres and contributes together with material dispersion to the total chromatic dispersion.

### Total Pulse Broadening & Bandwidth

If pulse broadening (rms or FWHM) is \(\Delta\tau\), the bandwidth–length product is roughly:

\[ \text{Bandwidth} \times L \approx \frac{0.44}{\Delta\tau} \quad (\text{for Gaussian pulses}) \]

Smaller \(\Delta\tau\) → higher possible bit‑rate for a given length.

---

## 8. Fibre Connectors, Splices, and Couplers

### Fibre Connectors

**Definition:** Mechanical devices for temporary joining of fibres. Useful for testing, modular systems, and reconfigurable links.

**Common types:** SC (push–pull), LC (small form factor), ST (bayonet), FC (threaded ferrule).

**Pros:** Reusable, easy to connect/disconnect.
**Cons:** Typically higher insertion loss and back‑reflection than splices.

**Typical parameters:** insertion loss (dB), return loss (dB).

### Fibre Splices

**Definition:** Permanent joining of two fibres to provide a continuous optical path.

**Types:**
- **Mechanical splice:** Align and hold fibres; use index‑matching gel or adhesive. Moderate loss.
- **Fusion splice:** Melt/fuse fibre ends (electric arc) — lowest loss, strong permanent joint.

**Comparison:** Fusion splicing gives lowest loss and highest strength but needs equipment; mechanical splicing is cheaper and faster for field repairs.

### Fibre Couplers

**Definition:** Devices that split or combine optical power between fibres.

**Types:**
- **1×N splitters:** Passive splitters for distributing a signal to many outputs.
- **2×2 couplers / directional couplers:** Split/combine with defined coupling ratio.

**Operating principle:** Evanescent coupling or fused‑taper techniques — optical field transfers between nearby waveguides.

**Applications:** Power splitting in PONs, monitoring taps, multiplexing/demultiplexing (with wavelength devices), sensor networks.

---

## 9. Applications of Optical Fibres

1. **Telecommunications:** Long‑haul backbone, metro networks, submarine cables — due to enormous bandwidth and low attenuation.
2. **Local Area Networks (LANs):** Multimode fibres for data‑centre interconnects and campus networks.
3. **Cable TV (CATV):** Distribution of RF/optical signals.
4. **Medical:** Endoscopy, minimally invasive imaging, laser delivery for surgery.
5. **Industrial & Sensing:** Temperature, strain, pressure sensors; process control in hazardous environments (immune to EMI).
6. **Defense & Aerospace:** Secure links, fibre‑optic gyroscopes, data buses in aircraft.
7. **Other:** Lighting, illumination, decorative uses, smart structures and structural health monitoring.

---

## 10. Quick Formula Sheet

- Critical angle: \(\sin\theta_c = \dfrac{n_2}{n_1}\)
- Numerical aperture: \(\text{NA} = \sqrt{n_1^2 - n_2^2}\)
- Acceptance angle: \(\theta_a = \sin^{-1}(\text{NA})\)
- V‑number: \(V = \dfrac{2\pi a}{\lambda}\,\text{NA}\)
- Single‑mode condition (step‑index): \(V < 2.405\)
- Material dispersion (approx): \(\Delta\tau_{\text{mat}} \approx D\,\Delta\lambda\,L\) where \(D\) in ps/(nm·km)
- Modal dispersion (approx for step‑index MMF): \(\Delta\tau_{\text{modal}} \approx \dfrac{L\,\text{NA}^2}{2c n_1}\)

---

## 11. Short (5/10‑mark) Answers — Copy‑ready

**Q: Define Numerical Aperture and derive its expression.**
A: (Start) Numerical aperture (NA) is the sine of the acceptance angle and represents the light‑gathering ability of the fibre. For a ray in air incident at angle \(\theta_a\), using Snell’s law and TIR geometry, one obtains \(\text{NA}=\sqrt{n_1^2-n_2^2}\). (Finish)

**Q: Explain fusion and mechanical splicing.**
A: (Start) Splicing permanently joins two fibres. Mechanical splicing aligns fibres using V‑grooves or clamps and uses index‑matching gel; fusion splicing melts the ends using an electric arc to form a continuous glass joint. Fusion splices have lower insertion loss and are mechanically stronger; mechanical splices are cheaper and useful for quick repairs. (Finish)

**Q: List applications of optical fibres.**
A: (Start) Telecommunications, medical endoscopy, sensors (temperature/strain), defense secure links, industrial process monitoring, lighting and display uses. (Finish)

(Include more 5‑mark ready answers by copying the document sections.)

---

## 12. Solved Numericals (2 examples)

### Example 1 — Numerical Aperture and Acceptance Angle
**Problem:** A fibre has core refractive index \(n_1 = 1.48\) and cladding index \(n_2 = 1.46\). Find NA and acceptance angle (in degrees) in air.

**Solution:**
\[ \text{NA} = \sqrt{1.48^2 - 1.46^2} = \sqrt{2.1904 - 2.1316} = \sqrt{0.0588} \approx 0.2426. \]
Acceptance angle: \(\theta_a = \sin^{-1}(0.2426) \approx 14.04^{\circ}.\)

**Answer:** NA \(\approx 0.243\); \(\theta_a \approx 14.0^{\circ}\).

---

### Example 2 — V‑number and Mode Condition
**Problem:** Using the fibre above with core radius \(a = 4\ \mu\text{m}\) and operating wavelength \(\lambda = 1.55\ \mu\text{m}\), determine V and state whether the fibre is single‑mode.

**Solution:**
\[ V = \frac{2\pi a}{\lambda}\,\text{NA} = \frac{2\pi (4\times10^{-6})}{1.55\times10^{-6}} \times 0.2426. \]
Calculate: \(\dfrac{2\pi\times4}{1.55} \approx \dfrac{25.1327}{1.55} \approx 16.21.\) Then \(V \approx 16.21\times0.2426 \approx 3.93.\)

Since \(V>2.405\), the fibre is **multimode** at \(\lambda=1.55\ \mu\text{m}\).

**Answer:** \(V\approx3.93\) → Multimode.

---

## 13. Exam Tips & Revision Checklist

- Memorize the **NA** and **V‑number** formulas and the single‑mode cutoff value \(2.405\).
- Practice deriving NA from Snell’s law (short derivation for 5‑mark answers).
- Know differences between **connector vs splice vs coupler** (table form helps).
- Understand sources of dispersion and which fibres minimize each type (SMF → chromatic/waveguide; MMF → modal).
- Work out at least 5 numericals on NA, V, modal delay and D‑parameter conversions.

---

### Want more from this canvas?
- I can add a **page of 10‑point short questions** for quick revision.
- I can export this as a **PDF** formatted for printing.
- I can add **more solved problems** (numericals) grouped by difficulty.

*(End of document.)*

