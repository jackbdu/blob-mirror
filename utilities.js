/*
 * Utilities
 * CCapture.js for Exporting Images/Videos
 * Stats.js for Showing Stats
 * Jack B. Du (github@jackbdu.com)
 * https://instagram.com/jackbdu/
 */

// data.GUI
// p5sketch.gui = new dat.GUI();
// const tempOptions = {};
// if (typeof p5sketch.guiOptions === 'object') {
//   for (const optionsCategory of Object.keys(p5sketch.guiOptions)) {
//     tempOptions[optionsCategory] = {};
//     const folder = p5sketch.gui.addFolder(optionsCategory);
//     const subOptions = p5sketch.guiOptions[optionsCategory];
//     for (const optionKey of Object.keys(subOptions)) {
//       const option = p5sketch.guiOptions[optionsCategory][optionKey];
//       // console.log(p5sketch.guiOptions[optionsCategory]);optionsCategoryoptionsCategory
//       tempOptions[optionsCategory][optionKey] = option[0];
//       if (optionKey.endsWith('Color')) {
//         folder.addColor(tempOptions[optionsCategory], optionKey)
//       } else {
//         folder.add(tempOptions[optionsCategory], optionKey, option[1], option[2])
//       }
//     }
//   }
//   p5sketch.options = tempOptions;
// }
// console.log(JSON.stringify(p5sketch.options));

// statsjs
if (p5sketch.specs.showStats) {
  p5sketch.stats = new Stats();
  p5sketch.stats.showPanel(0);
  document.body.appendChild(p5sketch.stats.dom);
}

// statsjs & ccapturejs
p5sketch.myPreDraw = () => {
  if (p5sketch.beginCapture) p5sketch.beginCapture();
  if (p5sketch.stats) p5sketch.stats.begin();
};

p5sketch.myPostDraw = () => {
  if (p5sketch.stats) p5sketch.stats.end();
  if (p5sketch.endCapture) p5sketch.endCapture();
};

p5sketch.capturerSpecs = {
  numStartCaptureFrame: 2,
  // numTotalCaptureFrames: p5sketch.specs.loopFramesNum, // uncomment this line to capture canvas
};
// specify output dimensions
//p5sketch.specs = {...p5sketch.specs, outputWidth: 1920, outputHeight: 1080 }; // 1080p horizontal
// p5sketch.specs = {...p5sketch.specs, outputWidth: 1080, outputHeight: 1920 }; // 1080p vertical
// p5sketch.specs = {...p5sketch.specs, outputWidth: 1920, outputHeight: 1920 }; // 1920x1920 square

p5sketch.canvasCapturer = new CCapture({
  format: "png",
  framerate: p5sketch.fps,
});

p5sketch.beginCapture = () => {
  if (p5sketch.canvasCapturer && p5sketch.capturerSpecs && p5sketch.capturerSpecs.numTotalCaptureFrames) {
    if (p5sketch.frameCount === p5sketch.capturerSpecs.numStartCaptureFrame || p5sketch.capturerSpecs.boolManualCaptureStart) {
      p5sketch.canvasCapturer.start();
      if (p5sketch.capturerSpecs.boolManualCaptureStart) {
        p5sketch.capturerSpecs.boolManualCaptureStart = false;
        p5sketch.capturerSpecs.numStartCaptureFrame = p5sketch.frameCount;
      }
    } else if (p5sketch.frameCount >= p5sketch.capturerSpecs.numStartCaptureFrame + p5sketch.capturerSpecs.numTotalCaptureFrames) {
      p5sketch.noLoop();
      console.log("canvas capturing ended.");
      p5sketch.canvasCapturer.stop();
      // default save, will download automatically a file called {name}.extension (webm/gif/tar)
      p5sketch.canvasCapturer.save();
      return;
    }
  }
};

p5sketch.endCapture = () => {
  if (p5sketch.canvasCapturer && p5sketch.capturerSpecs && p5sketch.capturerSpecs.numTotalCaptureFrames && p5sketch.frameCount >= p5sketch.capturerSpecs.numStartCaptureFrame) {
    console.log("capturing canvas frame...");
    p5sketch.canvasCapturer.capture(document.getElementById("defaultCanvas0"));
  }
};
