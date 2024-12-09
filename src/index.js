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
// document.body.appendChild(backgroundDiv);

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
// document.body.appendChild(markdownDiv);

// Dynamically Load README.md
fetch('https://raw.githubusercontent.com/joshmorgan1000/UTKH/refs/heads/main/THEORY.md')
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
        // Add some special multi-line HTML content at the bottom
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

var orbit_factor = 1.0;
var repel_factor = 1.0;
var total_forces = [];

const spheres = [];
const explosions = [];
let explosionCounter = 10;
const numSpheres = 17;

for (let i = 0; i < numSpheres; i++) {
    const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere${i}`, { diameter: 1.0 }, scene);
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
    total_forces.push(new BABYLON.Vector3(0, 0, 0));
}

// Gravity simulation
scene.registerBeforeRender(() => {
    if (explosionCounter < 1 || explosions.length > 0) {
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

            if (explosion.scale > 400) {
                toRemove.push(i);
            }
        }

        // Remove explosions that have grown too large
        for (let i = toRemove.length - 1; i >= 0; i--) {
            explosions[toRemove[i]].mesh.dispose();
            explosions.splice(explosions.indexOf(explosions[toRemove[i]]), 1);
        }
    } else {
        // Orbital mode

        // Make sure they are all at least 4 units away from the center
        for (let i = 0; i < spheres.length; i++) {
            const diff = BABYLON.Vector3.Zero().subtract(spheres[i].position);
            // Scale the distance so it totals to 4
            const distance = Math.max(diff.length(), 0.000000001); // Prevent division by zero
            total_forces[i].addInPlace(spheres[i].position.scale((-0.002 / (distance * distance))) * orbit_factor);
        }

        // Add force that wants to keep them apart. If they are very close, force them to be at least 0.1 apart
        for (let i = 0; i < spheres.length; i++) {
            for (let j = 0; j < spheres.length; j++) {
                if (i != j) {
                    const diff = spheres[i].position.subtract(spheres[j].position);
                    const distance = Math.max(diff.length(), 0.00000001); // Prevent division by zero
                    // Move them further apart from each other, make the force stronger as they are close
                    const force = diff.scale((0.0001 / (distance * distance)) * repel_factor);
                    total_forces[i].addInPlace(force);
                }
            }
        }

        // Apply forces
        for (let i = 0; i < spheres.length; i++) {
            // Every once in a while, add a random force to make it more interesting
            if (Math.random() < 0.4) {
                // total_forces[i].addInPlace(new BABYLON.Vector3(Math.random() * 0.1 - 0.5, Math.random() * 0.1 - 0.5, Math.random() * 0.1 - 0.5));
            }
            spheres[i].position.addInPlace(total_forces[i]);
        }
    }
});

// Add a layer on top of everything to hold the controls
const controlsDiv = document.createElement('div');
controlsDiv.style.position = 'absolute';
controlsDiv.style.top = '40px';
controlsDiv.style.left = '0';
controlsDiv.style.width = '100%';
controlsDiv.style.height = '60px';
controlsDiv.style.zIndex = '3';
controlsDiv.style.display = 'flex';
controlsDiv.style.flexDirection = 'row';
controlsDiv.style.justifyContent = 'right';
controlsDiv.style.alignItems = 'right';
// Make it white
controlsDiv.style.color = 'white';

document.body.appendChild(controlsDiv);

// Add a vertical slider on the right side of the screen to control the repel factor
const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0.5';
slider.max = '200';
slider.value = repel_factor;
slider.step = '0.1';
slider.style.position = 'absolute';
slider.style.top = '20px';
slider.style.right = '20px';
slider.style.width = '40%';
slider.style.zIndex = '3';
slider.style.background = 'white';
const sliderValue = document.createElement('div');
sliderValue.style.position = 'absolute';
sliderValue.style.top = '50px';
sliderValue.style.right = '20px';
sliderValue.style.color = 'white';
sliderValue.style.zIndex = '3';
slider.onchange = (event) => {
    repel_factor = parseFloat(event.target.value);
    sliderValue.innerText = `Repel Factor: ${repel_factor}`;
}
controlsDiv.appendChild(slider);
controlsDiv.appendChild(sliderValue);
// Add a small text box right under the slider to show the current value

// Add a vertical slider on the left side of the screen to control the orbit factor
const slider2 = document.createElement('input');
slider2.type = 'range';
slider2.min = '0.5';
slider2.max = '200';
slider2.top = '0';
slider2.value = orbit_factor;
slider2.step = '0.1';
slider2.style.position = 'absolute';
slider2.style.top = '20px';
slider2.style.left = '20px';
slider2.style.width = '40%';
// Add a small text box right under the slider to show the current value
const sliderValue2 = document.createElement('div');
sliderValue2.style.position = 'absolute';
sliderValue2.style.top = '50px';
sliderValue2.style.left = '20px';
sliderValue2.style.color = 'white';
sliderValue2.style.zIndex = '3';
slider2.onchange = (event) => {
    orbit_factor = parseFloat(event.target.value);
    sliderValue2.innerText = `Orbit Factor: ${orbit_factor}`;
}
slider2.style.zIndex = '3';
controlsDiv.appendChild(slider2);
controlsDiv.appendChild(sliderValue2);


// Start the engine
engine.runRenderLoop(() => {
    scene.render();
    sliderValue.innerText = `Repel Factor: ${repel_factor}`;
    sliderValue2.innerText = `Orbit Factor: ${orbit_factor}`;
});

// Handle window resize
window.addEventListener('resize', () => {
    engine.resize();
});
