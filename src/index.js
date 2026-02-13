import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3, Color3, Color4, StandardMaterial } from 'babylonjs';
import backgroundImage from './background.jpg';
import { marked } from 'marked';
import katex from 'katex';
import theoryMarkdown from '../THEORY.md';

// ── Fonts & KaTeX CSS ──────────────────────────────────────────────────────────
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap';
document.head.appendChild(fontLink);

const katexCSS = document.createElement('link');
katexCSS.rel = 'stylesheet';
katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';
document.head.appendChild(katexCSS);

// ── Global styles ──────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        overflow: hidden;
        background-color: #000;
        font-family: 'IBM Plex Mono', 'Fira Code', monospace;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    /* ── Scrollable content panel ─────────────────────────────────── */
    #content {
        position: absolute;
        top: 0; left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 40px);
        max-width: 860px;
        max-height: 100vh;
        overflow-y: auto;
        overflow-x: hidden;
        z-index: 2;
        padding: 48px 32px 80px;
        background: rgba(0, 0, 0, 0.72);
        border-left: 1px solid rgba(111, 230, 80, 0.08);
        border-right: 1px solid rgba(111, 230, 80, 0.08);
        color: #c8e6c0;
        font-size: 15px;
        line-height: 1.75;
        letter-spacing: 0.01em;
        scrollbar-width: thin;
        scrollbar-color: rgba(111, 230, 80, 0.3) transparent;
    }

    #content::-webkit-scrollbar { width: 6px; }
    #content::-webkit-scrollbar-track { background: transparent; }
    #content::-webkit-scrollbar-thumb {
        background: rgba(111, 230, 80, 0.25);
        border-radius: 3px;
    }
    #content::-webkit-scrollbar-thumb:hover {
        background: rgba(111, 230, 80, 0.45);
    }

    /* ── Headings ─────────────────────────────────────────────────── */
    #content h1 {
        font-family: 'Fira Code', monospace;
        color: #6FE650;
        font-size: 28px;
        font-weight: 700;
        text-align: center;
        margin: 0 0 32px;
        padding-bottom: 16px;
        border-bottom: 2px solid rgba(111, 230, 80, 0.25);
        text-shadow: 0 0 20px rgba(111, 230, 80, 0.3);
    }

    #content h2 {
        font-family: 'Fira Code', monospace;
        color: #6FE650;
        font-size: 22px;
        font-weight: 700;
        margin: 48px 0 20px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(111, 230, 80, 0.15);
        text-shadow: 0 0 12px rgba(111, 230, 80, 0.2);
    }

    #content h3 {
        font-family: 'Fira Code', monospace;
        color: #7dec5e;
        font-size: 18px;
        font-weight: 600;
        margin: 36px 0 14px;
    }

    #content h4 {
        color: #90e880;
        font-size: 16px;
        font-weight: 600;
        margin: 28px 0 10px;
    }

    #content h5, #content h6 {
        color: #a0d898;
        font-size: 14px;
        font-style: italic;
        margin: 20px 0 8px;
    }

    /* ── Paragraphs & text ────────────────────────────────────────── */
    #content p {
        margin: 0 0 16px;
    }

    #content strong {
        color: #6FE650;
        font-weight: 700;
    }

    #content em {
        color: #b8e0b0;
        font-style: italic;
    }

    /* ── Links ────────────────────────────────────────────────────── */
    #content a {
        color: #4fc3f7;
        text-decoration: none;
        border-bottom: 1px solid rgba(79, 195, 247, 0.3);
        transition: color 0.2s, border-color 0.2s;
    }
    #content a:hover {
        color: #81d4fa;
        border-bottom-color: #81d4fa;
    }

    /* ── Superscripts (references) ────────────────────────────────── */
    #content sup {
        font-size: 0.75em;
        line-height: 0;
    }
    #content sup a {
        color: #6FE650;
        border-bottom: none;
        font-weight: 500;
    }
    #content sup a:hover { color: #a0ff80; }

    /* ── Lists ────────────────────────────────────────────────────── */
    #content ul, #content ol {
        margin: 0 0 16px 24px;
        padding: 0;
    }
    #content li {
        margin-bottom: 6px;
    }
    #content li::marker {
        color: rgba(111, 230, 80, 0.5);
    }

    /* ── Horizontal rules ─────────────────────────────────────────── */
    #content hr {
        border: none;
        border-top: 1px solid rgba(111, 230, 80, 0.12);
        margin: 36px 0;
    }

    /* ── Code blocks ──────────────────────────────────────────────── */
    #content code {
        font-family: 'Fira Code', monospace;
        background: rgba(111, 230, 80, 0.06);
        color: #6FE650;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
    }
    #content pre {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(111, 230, 80, 0.1);
        border-radius: 4px;
        padding: 16px;
        overflow-x: auto;
        margin: 0 0 16px;
    }
    #content pre code {
        background: none;
        padding: 0;
    }

    /* ── Block quotes ─────────────────────────────────────────────── */
    #content blockquote {
        border-left: 3px solid rgba(111, 230, 80, 0.3);
        margin: 0 0 16px;
        padding: 8px 16px;
        color: #a0c898;
        font-style: italic;
    }

    /* ── Images ───────────────────────────────────────────────────── */
    #content img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin: 8px 0;
    }

    /* ── Subscript / sub elements ──────────────────────────────────── */
    #content sub {
        font-size: 0.8em;
        color: #8ab882;
        line-height: 1.4;
    }

    /* ── KaTeX math ───────────────────────────────────────────────── */
    .katex-display {
        margin: 24px 0 !important;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 8px 0;
    }
    .katex { color: #b0e8a0; }

    /* ── Tables ───────────────────────────────────────────────────── */
    #content table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
    }
    #content th, #content td {
        border: 1px solid rgba(111, 230, 80, 0.15);
        padding: 8px 12px;
        text-align: left;
    }
    #content th {
        background: rgba(111, 230, 80, 0.08);
        color: #6FE650;
    }

    /* ── iframes (YouTube, etc.) ──────────────────────────────────── */
    #content iframe {
        max-width: 100%;
        border-radius: 4px;
        margin: 16px 0;
    }

    /* ── Font size overrides for <font> tags ──────────────────────── */
    #content font[size="1"] {
        font-size: 0.8em;
        color: #8ab882;
    }

    /* ── Smooth fade-in ──────────────────────────────────────────── */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    #content.loaded { animation: fadeIn 0.6s ease-out forwards; }
`;
document.head.appendChild(style);

// ── Background ─────────────────────────────────────────────────────────────────
const backgroundDiv = document.createElement('div');
Object.assign(backgroundDiv.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100%', height: '100%',
    background: `url(${backgroundImage}) no-repeat center center fixed`,
    backgroundSize: 'cover',
    backgroundColor: '#000',
    opacity: '0.3',
    zIndex: '0',
});
document.body.appendChild(backgroundDiv);

// ── Babylon.js Canvas ──────────────────────────────────────────────────────────
const canvas = document.createElement('canvas');
Object.assign(canvas.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100%', height: '100%',
    zIndex: '1',
});
canvas.id = 'renderCanvas';
document.body.appendChild(canvas);

// ── Markdown Content Panel ─────────────────────────────────────────────────────
const markdownDiv = document.createElement('div');
markdownDiv.id = 'content';
document.body.appendChild(markdownDiv);

// ── Render THEORY.md ───────────────────────────────────────────────────────────
function renderTheory(markdown) {
    let htmlContent = marked(markdown);

    // Render display math: $$...$$
    htmlContent = htmlContent.replace(/\$\$([^$]+)\$\$/g, (match, math) =>
        katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })
    );

    // Render inline math: $...$
    htmlContent = htmlContent.replace(/\$([^$]+)\$/g, (match, math) =>
        katex.renderToString(math.trim(), { throwOnError: false, displayMode: false })
    );

    markdownDiv.innerHTML = htmlContent;
    markdownDiv.classList.add('loaded');
}

// Load from bundled source (local), with GitHub fallback
if (theoryMarkdown) {
    renderTheory(theoryMarkdown);
} else {
    fetch('https://raw.githubusercontent.com/joshmorgan1000/UTKH/refs/heads/main/THEORY.md')
        .then((response) => response.text())
        .then((markdown) => renderTheory(markdown))
        .catch((error) => {
            console.error('Error loading THEORY.md:', error);
            markdownDiv.innerHTML = '<p style="color:#f44;">Failed to load theory content.</p>';
        });
}

// ── Babylon.js Scene ───────────────────────────────────────────────────────────
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0, 0, 0, 0);

const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 4, 15, Vector3.Zero(), scene);
camera.attachControl(canvas, false);

const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
light.intensity = 0.9;

// ── Spheres ────────────────────────────────────────────────────────────────────
const spheres = [];
const explosions = [];
let explosionCounter = 0;
const numSpheres = 20;

function randomPosition() {
    return new Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
    );
}

for (let i = 0; i < numSpheres; i++) {
    const sphere = MeshBuilder.CreateSphere(`sphere${i}`, { diameter: Math.random() * 0.4 + 0.4 }, scene);
    sphere.material = new StandardMaterial(`material${i}`, scene);
    const r = Math.random() * 0.7;
    const b = Math.random() * (1.3 - r);
    const g = 1.1 - r - b;
    sphere.material.diffuseColor = new Color3(r, g, b);
    sphere.material.specularColor = new Color3(0.2, 0.2, 0.2);
    sphere.material.emissiveColor = new Color3(r * 0.15, g * 0.15, b * 0.15);
    sphere.position = randomPosition();
    spheres.push(sphere);
}

// ── Gravity simulation ─────────────────────────────────────────────────────────
scene.registerBeforeRender(() => {
    for (let i = 0; i < spheres.length; i++) {
        for (let j = 0; j < spheres.length; j++) {
            if (i !== j) {
                const dir = spheres[j].position.subtract(spheres[i].position);
                const distance = Math.max(dir.length(), 0.07);
                const force = dir.normalize().scale(0.1 / (distance * distance));
                const originalIPosition = spheres[i].position.clone();

                if (distance <= 0.07 || force.length() > 20) {
                    spheres[i].position = randomPosition();
                    spheres[j].position = randomPosition();

                    // Create explosion
                    const explosion = MeshBuilder.CreateSphere(
                        `explosion${explosionCounter}`,
                        { diameter: 0.3, updatable: true },
                        scene
                    );
                    explosion.material = new StandardMaterial(`explosionMat${explosionCounter}`, scene);
                    explosion.material.diffuseColor = new Color3(0.5, 0.7, 0.6);
                    explosion.material.emissiveColor = new Color3(0.3, 0.5, 0.4);
                    explosion.position = originalIPosition;
                    explosions.push({ mesh: explosion, material: explosion.material, scale: 0.4, alpha: 1 });
                    explosionCounter++;
                }

                spheres[i].position.addInPlace(force);
            }
        }
    }

    // Update & cull explosions (iterate backwards to safely splice)
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.scale *= 1.05;
        exp.mesh.scaling = new Vector3(exp.scale, exp.scale, exp.scale);
        exp.alpha *= 0.97;
        exp.material.alpha = exp.alpha;

        if (exp.scale > 400) {
            exp.mesh.dispose();
            explosions.splice(i, 1);
        }
    }
});

// ── Engine loop ────────────────────────────────────────────────────────────────
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
