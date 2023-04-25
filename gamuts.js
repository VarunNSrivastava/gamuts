import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ** utils **
// below methods are definitely inaccurate, but not totally wrong
function coneQuantalEfficiency(lambda) {
   // gaussian approx of LMS from wavelength
  const sCone =  Math.exp(-0.5 * Math.pow((lambda - 440) / 100, 2));
  const mCone =  Math.exp(-0.5 * Math.pow((lambda - 545) / 100, 2));
  const lCone =  Math.exp(-0.5 * Math.pow((lambda - 565) / 100, 2));

  return [sCone, mCone, lCone];
}

export {coneQuantalEfficiency}

function coneToXYZ(s, m, l) {
    // LMS to XYZ transformation

    // Hunt-pointer-estevez
    // https://en.wikipedia.org/wiki/CIE_1931_color_space
      const matrix = [
        [1.91020, -1.11212, 0.20191],
        [0.37095, 0.62905, 0],
        [0, 0, 1]
      ];
    //bradford
//    const matrix = [
//        [0.986993, -0.147054, 0.159963],
//        [0.432305, 0.51836, 0.0492912],
//        [-0.00852866, 0.0400428, 0.968487]
//    ];

  return [
    l * matrix[0][0] + m * matrix[0][1] + s * matrix[0][2],
    l * matrix[1][0] + m * matrix[1][1] + s * matrix[1][2],
    l * matrix[2][0] + m * matrix[2][1] + s * matrix[2][2]
  ];

}

function XYZToRGB(x, y, z) {
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_to_XYZ.htm
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
//  const matrix = [
//    [3.2404542, -1.5371385, -0.4985314],
//    [-0.9692660, 1.8760108, 0.0415560],
//    [0.0556434, -0.2040259, 1.0572252]
//  ]
    // "AppleRGB" idk
//    const matrix = [
//        [2.9515373, -1.2894116, -0.4738445],
//        [-1.0851093, 1.9908566, 0.0372026],
//        [0.0854934, -0.2694964, 1.0812975]
//    ];

    // sRGB
    const matrix = [
        [3.24, -1.53, -0.49],
        [-0.969, 1.87, 0.041],
        [0.055, -0.204, 1.057]
    ];
      const [r,g,b] = [
        x * matrix[0][0] + y * matrix[0][1] + z * matrix[0][2],
        x * matrix[1][0] + y * matrix[1][1] + z * matrix[1][2],
        x * matrix[2][0] + y * matrix[2][1] + z * matrix[2][2]
      ];
      return [r, g, b];

}

function coneToRGB(s, m, l) {
    const [x, y, z] = coneToXYZ(s, m, l);
    // normalizing seems to be worse
    // let sum = x + y + z;
    return XYZToRGB(x, y, z);
}

function verticesToColors(vertices) {
    const colors = [];

    for (let i = 0; i < vertices.length - 2; i += 3) {
        const s = vertices[i];
        const m = vertices[i + 1];
        const l = vertices[i + 2];

        const [r, g, b] = coneToRGB(s, m, l);
        colors.push(r, g, b);
    }
    return colors;
}

function normalizeColors(colors) {
    // for now we will just get rid of all negative terms
    // might normalize later;
    const transformedColors = colors.map((value) => {
        if (value < 0) { return 0; }
    });
    return transformedColors;
}

function normalizeVertices(vertices) {
    // precomputed means
    let x_mean = 0.568;
    let y_mean = 0.697;
    let z_mean = 0.688;

    const transformedVertices = vertices.map((value, index) => {
          if (index % 3 === 0) { // x value
            return value - x_mean;
          } else if (index % 3 === 1) { // y value
            return value - y_mean;
          } else { // z value
            return value - z_mean;
          }
        });
    return transformedVertices;
}

function generatePoints(geometry, vertices) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(normalizeVertices(vertices), 3));

    const colors = verticesToColors(vertices);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 5, vertexColors: true, sizeAttenuation: false });
    const points = new THREE.Points(geometry, material);
    return points;
}



// ** list of gamuts **
// boundaryGamut
const boundaryGamutGeometry = new THREE.BufferGeometry();
const boundaryVertices = [];

for (let lambda = 380; lambda <= 700; lambda++) {
  const [sCone, mCone, lCone] = coneQuantalEfficiency(lambda);
  boundaryVertices.push(sCone, mCone,  lCone);

  if (lambda == 380) {
    console.log("wavelength 380 cone values are (" + sCone + ", " + mCone + ", " + lCone + ")");
    let [r, g, b] =  coneToRGB(sCone, mCone, lCone);
    console.log("wavelength 380 rgb values are (" + r + ", " + g + ", " + b + ")");

  }
  if (lambda == 700) {
    console.log("wavelength 700 cone values are (" + sCone + ", " + mCone + ", " + lCone + ")");
    let [r, g, b] =  coneToRGB(sCone, mCone, lCone);
    console.log("wavelength 700 rgb values are (" + r + ", " + g + ", " + b + ")");

  }
}

const boundaryPoints = generatePoints(boundaryGamutGeometry, boundaryVertices);

export {boundaryPoints};

// conesGamut
function fillBoundary(boundaryVertices) {
  const interior = [];

//  let x_mean = 0;
//  let y_mean = 0;
//  let z_mean = 0;
//
//  let tally = 0;

  for (let i = 0; i < boundaryVertices.length - 3; i += 3) {
    for (let j = i + 3; j < boundaryVertices.length - 3; j += 3) {
        // lets make dt smaller when i and j are close together
        // e.g. when i and j are far, lets have dt = 0.01
        // when i and j are consecurive, lets have dt = 1/3
        let dt = Math.max(1 / (j - i), 0.01);


        for (let t = 0; t <= 1; t += dt) {
            const x = boundaryVertices[i] * (1 - t) + boundaryVertices[j] * t;
            const y =  boundaryVertices[i + 1] * (1 - t) + boundaryVertices[j + 1] * t;
            const z =  boundaryVertices[i + 2] * (1 - t) + boundaryVertices[j + 2] * t;

            interior.push(x, y, z);
//            x_mean += x;
//            y_mean += y;
//            z_mean += z;
//            tally += 1;
        }
    }
  }


  // console.log(x_mean / tally + '|' + y_mean / tally + '|' + z_mean / tally);

  return interior;
}

const conesGamutGeometry = new THREE.BufferGeometry();
const conesVertices = boundaryVertices.concat(fillBoundary(boundaryVertices));
const conesPoints = generatePoints(conesGamutGeometry, conesVertices);

export {conesPoints};


// ** ozGamuts **
// Oz Gamut

const sOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  != 0) ? 0 : value;
});

const mOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  != 1) ? 0 : value;
});

const lOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  != 2) ? 0 : value;
});

const ozVertices = boundaryVertices.concat(sOzVertices,mOzVertices,lOzVertices );
const ozGamutGeometry = new THREE.BufferGeometry();
const ozPoints = generatePoints(ozGamutGeometry, ozVertices);

export {ozPoints};

// 2-Oz Gamut

const mlOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  == 0) ? 0 : value;
});

const slOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  == 1) ? 0 : value;
});

const smOzVertices = boundaryVertices.map((value, index) => {
    return (index % 3  == 2) ? 0 : value;
});

const twoOzVertices = ozVertices.concat(mlOzVertices,slOzVertices,smOzVertices);
const twoOzGamutGeometry = new THREE.BufferGeometry();
const twoOzPoints = generatePoints(twoOzGamutGeometry, twoOzVertices);

export {twoOzPoints};


// rgbGamut

