import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3, Color3 } from 'babylonjs';
import backgroundImage from './background.jpg';
import { marked } from 'marked';
import katex from 'katex';

// Load Google Fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap';
document.head.appendChild(fontLink);

const fontLink2 = document.createElement('link');
fontLink2.rel = 'stylesheet';
fontLink2.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
document.head.appendChild(fontLink2);

// Set body styles
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.backgroundColor = 'black';

// Background Image
const backgroundDiv = document.createElement('div');
Object.assign(backgroundDiv.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: `url(${backgroundImage}) no-repeat center center fixed`,
    backgroundSize: 'cover',
    backgroundColor: 'black',
    opacity: '0.3',
    zIndex: '0',
});
document.body.appendChild(backgroundDiv);

// Babylon.js Canvas
const canvas = document.createElement('canvas');
Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '1',
});
canvas.id = 'renderCanvas';
document.body.appendChild(canvas);

// Markdown Div
const markdownDiv = document.createElement('div');
Object.assign(markdownDiv.style, {
    fontFamily: '"Fira Code", monospace',
    color: '#6FE650',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 'calc(100% - 40px)',
    maxWidth: '800px',
    padding: '20px',
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2',
    overflowY: 'auto',
    maxHeight: '100vh',
    boxSizing: 'border-box',
    margin: '0 20 0 20px'
});
document.body.appendChild(markdownDiv);

// Dynamically Load README.md
fetch('README.md')
    .then((response) => response.text())
    .then((markdown) => {
        // Process Markdown with marked and render math with KaTeX
        let htmlContent = marked(markdown);
        htmlContent = htmlContent.replace(/\$\$([^$]+)\$\$/g, (match, math) =>
            katex.renderToString(math, { throwOnError: false, displayMode: true })
        );
        htmlContent = htmlContent.replace(/\$([^$]+)\$/g, (match, math) =>
            katex.renderToString(math, { throwOnError: false, displayMode: false })
        );
        markdownDiv.innerHTML = htmlContent;
    })
    .catch((error) => console.error('Error loading README.md:', error));

// Babylon.js Scene with Gravitationally Attracted Spheres
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent canvas

const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    0,
    15,
    BABYLON.Vector3.Zero(),
    scene
);
camera.attachControl(canvas, false); // Disable user controls

const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 1, 0),
    scene
);

const spheres = [];
const explosions = [];
let explosionCounter = 0;
const numSpheres = 20;

for (let i = 0; i < numSpheres; i++) {
    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere${i}`, { diameter: Math.random() * 0.4 + 0.4 }, scene);
    sphere.material = new BABYLON.StandardMaterial(`material${i}`, scene);
    const r = Math.random() * 0.7;
    const b = Math.random() * (1.3 - r);
    const g = 1.3 - r - b;
    sphere.material.diffuseColor = new BABYLON.Color3(r, g, b);
    sphere.position = new BABYLON.Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
    );
    spheres.push(sphere);
}

// Gravity simulation
scene.registerBeforeRender(() => {
    for (let i = 0; i < spheres.length; i++) {
        for (let j = 0; j < spheres.length; j++) {
            if (i !== j) {
                const dir = spheres[j].position.subtract(spheres[i].position);
                const distance = Math.max(dir.length(), 0.07); // Prevent division by zero
                const force = dir.normalize().scale(0.1 / (distance * distance));
                if (distance <= 0.07 || force > 20) {
                    spheres[i].position = new BABYLON.Vector3(
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5,
                    );
                    spheres[j].position = new BABYLON.Vector3(
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5,
                    );
                    const explosion = BABYLON.MeshBuilder.CreateSphere(`explosion${explosionCounter}`, { diameter: 0.1 }, scene);
                    explosion.material = new BABYLON.StandardMaterial(`explosionMaterial${explosionCounter}`, scene);
                    explosion.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
                    explosion.position = spheres[i].position.clone();
                    explosions.push(explosion);
                    explosionCounter++;
                }
                spheres[i].position.addInPlace(force);
            }
        }
    }
    for (let i = 0; i < explosions.length; i++) {
        // Make the explosion grow in size exponentially
        explosions[i].scaling = explosions[i].scaling.add(new BABYLON.Vector3(1, 1, 1).scale(0.1));
        // Make the explosion become slightly more transparent
        explosions[i].material.alpha *= explosions[i].scaling.length() / 20;
        if (explosions[i].scaling.length() > 20) {
            explosions[i].dispose();
            explosions.splice(i, 1);
        }
    }
});

// Start the engine
engine.runRenderLoop(() => {
    scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
    engine.resize();
});
