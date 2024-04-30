/*
 * Main Sketch
 * Jack B. Du (github@jackbdu.com)
 * https://instagram.com/jackbdu/
 */

// todos:
// optimizations:
// [ ] use smaller graphics for ml5
// [ ] use non-cropped video for ml5

const sketch = (p) => {
  p.specs = {
    fps: 60,
    loopFramesNum: 240,
    outputWidth: "auto",
    outputHeight: "auto",
    //showStats: true,
    canvas: undefined,
    seed: 0,
  };

  p.options = {
    visuals: {
      size: 0.2,
      backgroundColor: "#000",
    },
    particle: {
      maxNum: 34,
      xFactor: 0.003,
      yFactor: 0.002,
    },
    sound: {
      tone: Tone,
      preload: {
        rhythmPlayers: {
          urls: {
            "rim-shot": "assets/RS.mp3",
            "mid-conga": "assets/MC00.mp3",
            "mid-tom": "assets/MT00.mp3",
          },
          volume: -16,
        },
      },
      setup: {
        meter: {
          smoothing: 0.95,
          normalRange: true,
          channels: 1,
        },
        // https://tonejs.github.io/docs/14.7.77/interface/FMSynthOptions
        chordSynth: {
          maxPolyphony: 6, // double chord notes num in case second chords start before first chords end?
          harmonicity: 0.5,
          modulation: {
            type: "fmsine",
          },
          volume: -8,
          envelope: {
            attack: 0.015,
            decay: 3.0,
            sustain: 0.0,
            release: 0.005,
          },
        },
        melodySynth: {
          detune: 0,
          envelope: {
            attack: 0.05,
            decay: 3.0,
            sustain: 0.01,
            release: 0.2,
          },
          harmonicity: 2,
          modulation: {
            type: "sine",
            partialCount: 2,
          },
          modulationEnvelope: {
            attack: 0.05,
            decay: 3.0,
            sustain: 0.01,
            release: 0.2,
          },
          modulationIndex: 2,
          oscillator: {},
          volume: -4,
        },
        bpmDiffAmplitude: 12000,
        bpm: 160,
        timeSignature: 4,
        interval: "4n",
        minMidi: 12,
        maxMidi: 96,
        melodyCenterMidi: 65,
        chordCenterMidi: 50,
        chordMidiArrayOffsets: [0, 2, 4],
        horizontalSemitonesNum: 36,
        verticalSemitonesNum: 4,
      },
    },
    shader: {
      preload: {
        paths: {
          vert: "assets/shader.vert",
          frag: "assets/shader.frag",
        },
      },
      update: {
        loopFramesNum: p.specs.loopFramesNum,
        colorDepth: 16,
        pixelationShortNum: 64,
      },
    },
    media: {
      preload: {
        // path: 'assets/qrcode.png',
        // type: 'image',
        // path: 'assets/heart.mp4',
        // type: 'video',
        type: "capture",
      },
      setup: {
        flipped: true,
      },
      update: {
        fit: p.COVER,
      },
    },
    ml5: {
      preload: {
        ml5: ml5,
        placeholderBodyPath: "assets/bodypose.json",
      },
      setup: {
        modelName: "MoveNet",
        bodyPose: {
          modelType: "MULTIPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDE"
          enableSmoothing: true,
          minPoseScore: 0.25,
          // multiPoseMaxDimension: 256,
          // enableTracking: true,
          // trackerType: "boundingBox", // "keypoint" or "boundingBox"
          // trackerConfig: {},
          // modelUrl: undefined,
        },
        smoothness: 0.8,
        // isDebugging: true,
        categorizedIndices: {
          rhythm: [1, 2],
          melody: [10, 8, 7, 9],
          timbre: [6, 12, 11, 5],
          chord: [16, 14, 13, 15],
        },
        strokeWeight: 0.01,
        strokeColor: "#fff",
        size: 0.75,
      },
    },
    ui: {
      preload: {
        fontUrl: "assets/Ubuntu-Bold.ttf",
        // textFont: 'Ubuntu',
      },
      textStyle: p.BOLD,
      messages: {
        loading: "Loading...".toUpperCase(),
        loaded: "Click to Activate Audio".toUpperCase(),
        started: "",
      },
      textFill: 255,
      textStroke: 0,
      textStrokeWeight: 10,
      // showFrameRate: true,
    },
  };

  p.uiManager = new UiManager(p.options.ui);
  p.shaderManager = new ShaderManager();
  p.mediaManager = new MediaManager(p);
  p.ml5Manager = new Ml5Manager();
  p.soundManager = new SoundManager(p.options.sound.tone);

  p.preload = () => {
    p.uiManager.preload(p, p.options.ui.preload);
    p.mediaManager.preload(p, p.options.media.preload);
    p.soundManager.preload(p.options.sound.preload);
    p.shaderManager.preload(p.loadShader, p.options.shader.preload);
    p.ml5Manager.preload(p.options.ml5.preload);
  };

  p.setup = () => {
    p.updateCanvas(p.specs.outputWidth, p.specs.outputHeight);
    p.frameRate(p.specs.fps);
    p.smooth();
    p.randomSeed(p.specs.seed);
    p.noiseSeed(p.specs.seed);
    p.uiManager.setup(p.specs.canvas);
    p.soundManager.setup(p.options.sound.setup);
    p.shaderManager.setup(p.createGraphics(p.width, p.height, p.WEBGL));
    const mediaSetupOptions = {
      ...p.options.media.setup,
      width: p.width,
      height: p.height,
      // onLoaded: function () {},
    };
    p.mediaManager.setup(p, mediaSetupOptions);
    const ml5SetupOptions = {
      ...p.options.ml5.setup,
      graphics: p.mediaManager.graphics,
    };
    p.ml5Manager.setup(p.width, p.height, ml5SetupOptions);
  };

  p.myUpdate = () => {
    //     const ptexture = p.mediaManager.graphics.get();
    p.mediaManager.update(p.options.media.update);
    const particleCoords = new Array(p.options.particle.maxNum);
    for (let i = 0; i < particleCoords.length; i++) {
      particleCoords[i] = {
        x: p.noise(i, p.frameCount * p.options.particle.xFactor) - 0.5,
        y: p.noise(i, p.frameCount * p.options.particle.yFactor) - 0.5,
      };
    }
    p.ml5Manager.update(particleCoords);
    p.soundManager.update(p.ml5Manager.getCategorizedCoords(), Math.max(...p.ml5Manager.getMovementScores()));
    //console.log(p.ml5Manager.getMovementScores());
    const rhythmMeterValue = p.soundManager.getRhythmMeterValue();
    const bodyCoords = p.soundManager.getCoordValueArray();
    const shaderUpdateOptions = {
      ...p.options.shader.update,
      frameCount: p.frameCount,
      bpm: p.soundManager.getBpmValue(),
      pixelDensity: p.pixelDensity(),
      mouseX: p.mouseX,
      mouseY: p.mouseY,
      texture: p.mediaManager.graphics,
      bodyCoords: bodyCoords,
    };
    p.shaderManager.update(shaderUpdateOptions);
    const allLoaded = p.mediaManager.loaded && p.ml5Manager.loaded && p.soundManager.loaded;
    const allStarted = p.soundManager.started;
    p.uiManager.update(allLoaded, allStarted);
  };

  p.myDraw = () => {
    p.background(p.options.visuals.backgroundColor);
    p.shaderManager.draw(p);
    p.uiManager.display(p);
    // p.ml5Manager.display(p);
  };

  p.mousePressed = (event) => {
    p.soundManager.mousePressed(event);
    // p.uiManager.mousePressed(event);
  };

  p.windowResized = (event) => {
    p.updateCanvas(p.specs.outputWidth, p.specs.outputHeight);
    p.mediaManager.canvasResized(p.width, p.height);
    p.shaderManager.canvasResized(p.width, p.height);
    p.ml5Manager.updateRefSize(p.width, p.height);
  };

  p.updateCanvas = (outputWidth = "auto", outputHeight = "auto") => {
    const pd = p.pixelDensity();
    const canvasWidth = outputWidth && outputWidth !== "auto" ? outputWidth / pd : p.windowWidth;
    const canvasHeight = outputHeight && outputHeight !== "auto" ? outputHeight / pd : p.windowHeight;
    if (canvasWidth !== p.width || canvasHeight !== p.height) {
      if (!p.specs.canvas) {
        p.specs.canvas = p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);
      } else {
        p.resizeCanvas(canvasWidth, canvasHeight);
      }
    }
  };

  p.draw = () => {
    if (p.myUpdate) p.myUpdate();
    if (p.myPreDraw) p.myPreDraw();
    if (p.myDraw) p.myDraw();
    if (p.myPostDraw) p.myPostDraw();
  };
};

// workaround for ml5-next-gen in p5 instance mode
window._incrementPreload = () => {
  console.log("ml5.bodypose called window._incrementPreload");
};
window._decrementPreload = () => {
  console.log("ml5.bodypose called window._decrementPreload");
};

let p5sketch = new p5(sketch);