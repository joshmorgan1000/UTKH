import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3, Color3, Color4, StandardMaterial } from 'babylonjs';
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
    overflowX: 'hidden',
    maxHeight: '100vh',
    boxSizing: 'border-box',
    margin: '0 20px 0 20px'
});
document.body.appendChild(markdownDiv);

// Dynamically Load README.md
fetch('https://raw.githubusercontent.com/joshmorgan1000/UTKH/refs/heads/main/NARRATIVE.md')
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

// Set clear color to transparent
scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent canvas

const camera = new BABYLON.ArcRotateCamera(
    'camera',
    Math.PI / 2,
    Math.PI / 4,
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
    const g = 1.1 - r - b;
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
                const originalIPosition = spheres[i].position.clone();
                if (distance <= 0.07 || force.length() > 20) {
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

                    // Create explosion sphere
                    const explosion = BABYLON.MeshBuilder.CreateSphere(`explosion${explosionCounter}`, { diameter: 0.3, updatable: true }, scene);
                    explosion.material = new BABYLON.StandardMaterial(`explosionMaterial${explosionCounter}`, scene);
                    explosion.material.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.6);
                    explosion.position = originalIPosition;
                    explosions.push({ mesh: explosion, material: explosion.material, scale: 0.4, alpha: 1 });
                    explosionCounter++;
                }
                spheres[i].position.addInPlace(force);
            }
        }
    }

    const toRemove = [];

    // Update explosions
    for (let i = 0; i < explosions.length; i++) {
        const explosion = explosions[i];
        // Make the explosion grow in size exponentially
        explosion.scale *= 1.05;
        explosion.mesh.scaling = new BABYLON.Vector3(explosion.scale, explosion.scale, explosion.scale);

        explosion.alpha = explosion.alpha * 0.97;
        explosion.material.alpha = explosion.alpha;
        explosion.material.opacity = explosion.alpha;

        console.log('Scale: ' + explosion.scale + ' Position: ' + explosion.mesh.position + ' Alpha: ' + explosion.alpha);

        if (explosion.scale > 400) {
            toRemove.push(i);
        }
    }

    // Remove finished explosions
    for (let i = toRemove.length - 1; i >= 0; i--) {
        explosions[toRemove[i]].mesh.dispose();
        explosions.splice(explosions.indexOf(explosions[toRemove[i]]), 1);
    }
});

/*
let num = 3;

// Every 1 second, send a request to localhost:5000 to get the sphere positions
scene.registerBeforeRender(() => {
    fetch(`http://localhost:5010/sphere`)
        .then((response) => response.json())
        .then((data) => {
            // Create new spheres
            for (let i = 0; i < data.length; i++) {
                if (spheres[i]) {
                    spheres[i].position = new BABYLON.Vector3(data[i][0], data[i][1], data[i][2]);
                } else {
                    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere${i}`, { diameter: 0.4 }, scene);
                    sphere.material = new BABYLON.StandardMaterial(`material${i}`, scene);
                    const r = Math.random() * 0.7;
                    const b = Math.random() * (1.3 - r);
                    const g = 1.1 - r - b;
                    sphere.material.diffuseColor = new BABYLON.Color3(r, g, b);
                    sphere.position = new BABYLON.Vector3(data[i][0], data[i][1], data[i][2]);
                    spheres.push(sphere);
                    }
            }
            num++;
            if (num > 10) {
                num = 3;
            }
        })
        .catch((error) => {});
});
*/

// Start the engine
engine.runRenderLoop(() => {
    scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
    engine.resize();
});