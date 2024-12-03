import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3, Color3 } from 'babylonjs';
import backgroundImage from './background.jpg';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Load Google Fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap';
document.head.appendChild(fontLink);

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
    opacity: '0.4',
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
    fontFamily: '"Noto Sans", monospace',
    color: '#aabbaa',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly transparent background
    width: '100%',
    maxWidth: '800px',
    padding: '20px',
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2',
    overflowY: 'auto', // Scroll only the top div
    maxHeight: '100vh',
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
    Math.PI / 2,
    Math.PI / 4,
    10,
    BABYLON.Vector3.Zero(),
    scene
);
camera.attachControl(canvas, false); // Disable user controls

const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 1, 0),
    scene
);

// Create gravitationally attracted spheres
const spheres = [];
const numSpheres = 7;
const colors = [
    new BABYLON.Color3(0.8, 0.1, 0.1),
    new BABYLON.Color3(0.2, 6.0, 0.2),
    new BABYLON.Color3(0.1, 0.2, 0.8),
    new BABYLON.Color3(0.6, 0.2, 0.1),
    new BABYLON.Color3(0.2, 5.0, 0.1),
    new BABYLON.Color3(0.1, 0.2, 0.6),
    new BABYLON.Color3(0.7, 0.7, 0.7),
];

for (let i = 0; i < numSpheres; i++) {
    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere${i}`, { diameter: Math.random() * 0.2 + 0.2 }, scene);
    sphere.material = new BABYLON.StandardMaterial(`material${i}`, scene);
    sphere.material.diffuseColor = colors[i];
    sphere.position = new BABYLON.Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
    );
    spheres.push(sphere);
}

// Gravity simulation
scene.registerBeforeRender(() => {
    for (let i = 0; i < spheres.length; i++) {
        for (let j = 0; j < spheres.length; j++) {
            if (i !== j) {
                const dir = spheres[j].position.subtract(spheres[i].position);
                const distance = Math.max(dir.length(), 0.001); // Prevent division by zero
                const force = dir.normalize().scale(0.005 / (distance * distance));
                spheres[i].position.addInPlace(force);
            }
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
