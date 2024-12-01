// app.js

// Get the canvas container
var canvasContainer = document.getElementById('canvasContainer');

// Create a new canvas element
var canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.display = 'block';
canvasContainer.appendChild(canvas);

// Initialize Babylon.js engine
var engine = new BABYLON.Engine(canvas, true);

// Set a variable to hold the scene
var scene;

// Fetch the README.md file
fetch('README.md')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text();
  })
  .then((markdown) => {
    // Convert Markdown to HTML
    var htmlContent = marked.parse(markdown);

    // Render equations using KaTeX
    var tempDiv = document.getElementById('markdownContent');
    tempDiv.innerHTML = htmlContent;
    renderMathInElement(tempDiv, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: true },
      ],
      throwOnError: false,
    });

    // Initialize the scene with the processed HTML content
    initializeScene(tempDiv);
  })
  .catch((error) => {
    console.error('Error fetching README.md:', error);
  });

function initializeScene(contentElement) {
  scene = new BABYLON.Scene(engine);

  // Set scene clear color to black
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background to show the background image

  // Create a basic camera and allow users to manipulate it
  var camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, BABYLON.Vector3.Zero(), scene);
  camera.setPosition(new BABYLON.Vector3(0, 0, 10));

  // Add a light to the scene
  var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  // Create spheres
  var spheres = [];
  for (var i = 0; i < 4; i++) {
    var sphere = BABYLON.MeshBuilder.CreateSphere('sphere' + i, { diameter: 0.5 }, scene);
    sphere.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );

    var material = new BABYLON.StandardMaterial('material' + i, scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    material.alpha = 0.9;
    sphere.material = material;

    spheres.push(sphere);
  }

  // Animation
  scene.registerBeforeRender(function () {
    spheres.forEach(function (sphere) {
      sphere.position.x += (Math.random() - 0.5) * 0.01;
      sphere.position.y += (Math.random() - 0.5) * 0.01;
      sphere.position.z += (Math.random() - 0.5) * 0.01;
    });
  });

  // Create GUI
  var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

  // Create ScrollViewer
  var scrollViewer = new BABYLON.GUI.ScrollViewer();
  scrollViewer.thickness = 0;
  scrollViewer.background = "transparent";
  scrollViewer.width = 1;
  scrollViewer.height = 1;
  advancedTexture.addControl(scrollViewer);

  // Create a Rectangle to hold the HTML content
  var htmlContentControl = new BABYLON.GUI.Rectangle();
  htmlContentControl.width = "512px";
  htmlContentControl.height = "auto";
  htmlContentControl.thickness = 0;
  htmlContentControl.background = "transparent";
  htmlContentControl.isPointerBlocker = false;

  // Make the contentElement visible before rendering
  contentElement.style.display = 'block';

  // Use html2canvas to render the contentElement
  html2canvas(contentElement, {
    backgroundColor: null,
    width: contentElement.scrollWidth,
    height: contentElement.scrollHeight,
    scale: 1,
  }).then(function (canvasImage) {
    // Hide the contentElement after rendering
    contentElement.style.display = 'none';

    var image = new BABYLON.GUI.Image('htmlImage', canvasImage.toDataURL());
    image.autoScale = true;
    htmlContentControl.addControl(image);

    // Update the height of the Rectangle to match the content
   // htmlContentControl.height = contentElement.scrollHeight + 'px';
  });

  scrollViewer.addControl(htmlContentControl);

  // Handle scrolling interaction
  scrollViewer.onWheelObservable.add(function (pi) {
    var delta = pi.event.deltaY;
    // Move spheres
    spheres.forEach(function (sphere) {
      sphere.position.y += delta * 0.001;
    });
  });

  // Handle mouse movement
  scene.onPointerObservable.add(function (pointerInfo) {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      var event = pointerInfo.event;
      var movementX = event.movementX || 0;
      var movementY = event.movementY || 0;

      spheres.forEach(function (sphere) {
        sphere.position.x += movementX * 0.01; // Increased sensitivity
        sphere.position.z += movementY * 0.01; // Increased sensitivity
      });
    }
  });

  // Run the render loop
  engine.runRenderLoop(function () {
    if (scene) {
      scene.render();
    }
  });

  // Resize
  window.addEventListener('resize', function () {
    engine.resize();
  });
}
