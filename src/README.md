## If You Want to Build and Host

It would be cool if you did, shoot me a line if you do! I'd be interested to hear about it.

Requirements: npm, node

From the root directory of this project:
```
npm install
npm run build
```
Artifacts will be produced in the `dist/` directory. Simply copy the index.html, bundle.js, and background.jpg to your web directory.

Alternatively, you can just run:
```
npx serve dist
```
And view the "magic" locally.

## Simulations for the Geometry Function

Example code has been provided as the python script `polyhedral_vertices.py`. The numer of vertices is hard-coded, but you can change and test to your heart's desire. Just run:
```
python3 polyhedral_vertices.py
```

The script `simulator_backend.py` is curently under development, but is meant to help visualize the concepts and potential orbital patterns.

## Contribute

If you would like to fork/contribute, you can run:
```
python3 toc_generate
```
from this `src` directory in order to re-generate the table of contents in the README.md file.