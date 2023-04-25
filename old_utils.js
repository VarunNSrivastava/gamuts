
function validSensitivity() {
    let sConeSum = 0;
    let mConeSum = 0;
    let lConeSum = 0;

    let pdfSum = 0;

    for (let lambda = 380; lambda <= 700; lambda += 150) {
        const pdfValue = Math.random();
        const [sCone, mCone, lCone] = coneQuantalEfficiency(lambda);


        sConeSum += sCone * pdfValue;
        mConeSum += mCone * pdfValue;
        lConeSum += lCone * pdfValue;

        pdfSum += pdfValue;
    }
    return [sConeSum / pdfSum, mConeSum / pdfSum, lConeSum / pdfSum];

}


// code from https://academo.org/demos/wavelength-to-colour-relationship/
function nmToRgb(wavelength){
    var Gamma = 0.80,
    IntensityMax = 255,
    factor, red, green, blue;
    if((wavelength >= 380) && (wavelength<440)){
        red = -(wavelength - 440) / (440 - 380);
        green = 0.0;
        blue = 1.0;
    }else if((wavelength >= 440) && (wavelength<490)){
        red = 0.0;
        green = (wavelength - 440) / (490 - 440);
        blue = 1.0;
    }else if((wavelength >= 490) && (wavelength<510)){
        red = 0.0;
        green = 1.0;
        blue = -(wavelength - 510) / (510 - 490);
    }else if((wavelength >= 510) && (wavelength<580)){
        red = (wavelength - 510) / (580 - 510);
        green = 1.0;
        blue = 0.0;
    }else if((wavelength >= 580) && (wavelength<645)){
        red = 1.0;
        green = -(wavelength - 645) / (645 - 580);
        blue = 0.0;
    }else if((wavelength >= 645) && (wavelength<781)){
        red = 1.0;
        green = 0.0;
        blue = 0.0;
    }else{
        red = 0.0;
        green = 0.0;
        blue = 0.0;
    };
    // Let the intensity fall off near the vision limits
    if((wavelength >= 380) && (wavelength<420)){
        factor = 0.3 + 0.7*(wavelength - 380) / (420 - 380);
    }else if((wavelength >= 420) && (wavelength<701)){
        factor = 1.0;
    }else if((wavelength >= 701) && (wavelength<781)){
        factor = 0.3 + 0.7*(780 - wavelength) / (780 - 700);
    }else{
        factor = 0.0;
    };
    if (red !== 0){
        red = Math.round(IntensityMax * Math.pow(red * factor, Gamma));
    }
    if (green !== 0){
        green = Math.round(IntensityMax * Math.pow(green * factor, Gamma));
    }
    if (blue !== 0){
        blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma));
    }
    return [red,green,blue];
}

function generateRandomSpectrumPDF(numPoints) {
  const pdf = new Array(700 - 380 + 1).fill(0);

  const randomPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const wavelength = 380 + Math.floor(Math.random() * (700 - 380 + 1));
    const value = Math.random();
    randomPoints.push({ wavelength, value });
  }

  // Sort the random points by wavelength
  randomPoints.sort((a, b) => a.wavelength - b.wavelength);

  // Perform linear interpolation between the random points
  let index = 0;
  for (let i = 0; i < randomPoints.length - 1; i++) {
    const startPoint = randomPoints[i];
    const endPoint = randomPoints[i + 1];
    const intervalLength = endPoint.wavelength - startPoint.wavelength;

    for (let j = 0; j <= intervalLength; j++) {
      const t = j / intervalLength;
      const interpolatedValue = startPoint.value * (1 - t) + endPoint.value * t;
      pdf[index++] = interpolatedValue;
    }
  }

  // Normalize the values to make it a valid PDF
  const sum = pdf.reduce((acc, value) => acc + value, 0);
  if (sum < 0) {
    console.log("we get nans");
  }

  pdf.forEach((value, i) => (pdf[i] /= sum));

  return pdf;
}

function integratePDF(pdf) {
  let sConeSum = 0;
  let mConeSum = 0;
  let lConeSum = 0;

  for (let lambda = 380; lambda <= 700; lambda++) {
    const [sCone, mCone, lCone] = coneQuantalEfficiency(lambda);
    const pdfValue = pdf[lambda - 380];

    sConeSum += sCone * pdfValue;
    mConeSum += mCone * pdfValue;
    lConeSum += lCone * pdfValue;
  }

  return [sConeSum, mConeSum, lConeSum];
}



// this function is definitely wrong
function coneToSRGB(sCone, mCone, lCone) {
  // Cone response to CIE XYZ
  const x = 0.15514 * sCone + 0.54312 * mCone + (-0.03286) * lCone;
  const y = (-0.15514) * sCone + 0.45684 * mCone + 0.03286 * lCone;
  const z = 0.01708 * mCone + 0.92962 * lCone;

  // CIE XYZ to linear sRGB
  const rLinear = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const gLinear = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const bLinear = 0.0557 * x - 0.2040 * y + 1.0570 * z;

  // Linear to gamma-corrected sRGB
  const gammaCorrect = (value) => value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

  const rSRGB = gammaCorrect(rLinear);
  const gSRGB = gammaCorrect(gLinear);
  const bSRGB = gammaCorrect(bLinear);


  return [rSRGB, gSRGB, bSRGB];
}