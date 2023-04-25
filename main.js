import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { boundaryPoints, conesPoints, ozPoints, twoOzPoints } from './gamuts.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000 );

// todo: add camera position, orientation to control menu

// todo: add bounding box (shifted by means)

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const controls = new OrbitControls( camera, renderer.domElement );
const loader = new GLTFLoader();


camera.position.z = 1;

let currentGamut = "Cones";

function updateGamut(type) {
    switch(currentGamut) {
        case "Cones":
            scene.remove(conesPoints);
            break;
        case "Monochromatic":
            scene.remove(boundaryPoints);
            break;
        case "Oz":
            scene.remove(ozPoints);
            break;
        case "Expanded Oz":
            scene.remove(twoOzPoints);
            break;
    }
    switch(type) {
        case "Cones":
            scene.add(conesPoints);
            break;
        case "Monochromatic":
            scene.add(boundaryPoints);
            break;
        case "Oz":
            scene.add(ozPoints);
            break;
        case "Expanded Oz":
            scene.add(twoOzPoints);
            break;
    }
    currentGamut = type;
}

function rotateGamut() {
    conesPoints.rotation.y += 0.001;
    boundaryPoints.rotation.y += 0.001;
    ozPoints.rotation.y += 0.001;
    twoOzPoints.rotation.y += 0.001;
}

const options = { gamut: currentGamut}
const gui = new GUI();
gui.add(options, "gamut", ["Cones", "Monochromatic", "Oz", "Expanded Oz"]).onChange( value => { updateGamut(value);} );

scene.add(conesPoints);

const loadingScreen = document.getElementById('loading-screen');
loadingScreen.remove();


// called 60 times a second
function animate() {
	requestAnimationFrame( animate );
	rotateGamut();
	renderer.render( scene, camera );
}
animate();