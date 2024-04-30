class Ml5Manager {
  // placeholderBodies: {
  //   sequence: [],
  //   frameCount: 0,
  //   framesPerSecond: 60,
  //   index: 0,
  //   getNextFrame: function() {
  //     this.frameCount++;
  //     this.index = Math.floor(this.frameCount/this.framesPerSecond);
  //     if (this.index >= Object.keys(this.sequence).length) {
  //       this.index = 0;
  //       this.frameCount = 0;
  //     }
  //     return this.sequence[this.index];
  //   }
  // },

  constructor() {
    this.loaded = false;
  }
  preload(options) {
    this.ml5 = options?.ml5 ?? ml5;
    // this.placeholderBodies.sequence = p5sketch.loadJSON(options.placeholderBodiesPath);
    this.placeholderBodies = [p5sketch.loadJSON(options.placeholderBodyPath)];
  }
  setup(canvasWidth, canvasHeight, options) {
    this.smoothness = options?.smoothness ?? 0.5;
    this.isDebugging = options?.isDebugging ?? false;
    //this.visibleIndices = options?.visibleIndices ?? undefined;
    this.categorizedIndices = options?.categorizedIndices ?? {};
    this.strokeWeight = options?.strokeWeight ?? 0.01;
    this.strokeColor = options?.strokeColor ?? "#fff";
    this.size = options?.size ?? 1;
    const bodyPoseOptions = options?.bodyPose ?? {};
    const modelName = options?.modelName ?? "MoveNet";
    // console.log(this.placeholderBodies.sequence);
    this.updateRefSize(canvasWidth, canvasHeight);
    this.bodies = [];
    this.pbodies = [];
    this.movementScores = [0];
    try {
      this.graphics = options?.graphics;
    } catch (e) {
      console.error(e);
    }
    this.bodyPose = this.ml5.bodyPose(modelName, bodyPoseOptions, (bodyPose, error) => {
      if (error) {
        console.error(error);
      } else {
        this.loaded = true;
        bodyPose.detectStart(this.graphics, (results) => {
          this.updateBodies(results);
        });
      }
    });
  }

  getCategorizedCoords() {
    const categorizedCoords = [];
    for (const body of this.bodies) {
      const bodyCoords = {};
      for (const category of Object.keys(this.categorizedIndices)) {
        const indices = this.categorizedIndices[category];
        const coords = [];
        for (const index of indices) {
          const keypoint = body.keypoints[index];
          const coord = {
            x: keypoint.x,
            y: keypoint.y,
          };
          coords.push(coord);
        }
        bodyCoords[category] = coords;
      }
      categorizedCoords.push(bodyCoords);
    }
    return categorizedCoords;
  }

  getMovementScores() {
    const newScores = this.getBodyDiffScores(this.pbodies, this.bodies);
    for (let i = 0; i < newScores.length; i++) {
      if (typeof this.movementScores[i] !== Number) {
        this.movementScores[i] = newScores[i];
      } else {
        this.movementScores[i] = this.movementScores * this.smoothness + newScores[i] * (1 - this.smoothness);
      }
    }
    return this.movementScores;
  }

  getKeypoints(options) {
    let keypoints = [];
    for (const body of this.bodies) {
      keypoints = body.keypoints;
    }
    return keypoints;
  }

  // only returning used properties
  normalizeBodies(bodies) {
    const realWidth = this.graphics.width * this.graphics.pixelDensity();
    const realHeight = this.graphics.height * this.graphics.pixelDensity();
    const normalizedBodies = [];
    for (const body of bodies) {
      const normalizedBody = { keypoints: [], box: {} };
      for (const keypoint of body.keypoints) {
        const normalizedKeypoint = { score: keypoint.score };
        normalizedKeypoint.x = keypoint.x / realWidth - 0.5;
        normalizedKeypoint.y = keypoint.y / realHeight - 0.5;
        normalizedBody.keypoints.push(normalizedKeypoint);
      }
      normalizedBody.box["xMin"] = body.box["xMin"] / realWidth - 0.5;
      normalizedBody.box["xMax"] = body.box["xMax"] / realWidth - 0.5;
      normalizedBody.box["yMin"] = body.box["yMin"] / realHeight - 0.5;
      normalizedBody.box["yMax"] = body.box["yMax"] / realHeight - 0.5;
      normalizedBody.box["width"] = body.box["width"] / realWidth;
      normalizedBody.box["height"] = body.box["height"] / realHeight;
      normalizedBodies.push(normalizedBody);
    }
    return normalizedBodies;
  }

  updateBodies(bodies) {
    if (bodies.length < 1) {
      // const placeholderBodies = this.placeholderBodies.getNextFrame();
      // bodies = JSON.parse(JSON.stringify(placeholderBodies));

      bodies = JSON.parse(JSON.stringify(this.placeholderBodies));
    } else {
      bodies = this.normalizeBodies(bodies);
    }
    if (bodies.length > 0 && this.bodies.length > 0) {
      // console.log(bodies);
      this.pbodies = this.bodies;
      // this.bodies = bodies;
      this.bodies = this.smoothBodies(this.pbodies, bodies, this.smoothness);
    } else if (bodies.length > 0 && !this.bodies.length > 0) {
      this.pbodies = bodies;
      // this.bodies = bodies;
      this.bodies = this.smoothBodies(this.pbodies, bodies, this.smoothness);
    }

    //     // Press key to record
    //     if (p5sketch.keyIsPressed) {
    //       this.recordedBodies.push(this.bodies);
    //       // console.log('recording');
    //     }

    //     // Press mouse to init and clear recorded bodies
    //     if (p5sketch.mouseIsPressed) {
    //       if (this.recordedBodies?.length > 0) {
    //         console.log('saving');
    //         p5sketch.saveJSON(this.recordedBodies, 'bodypose.json');
    //       }
    //       console.log('clearing');
    //       this.recordedBodies = [];
    //     }

    // console.log(bodies);
    for (let body of this.bodies) {
    }
  }

  update(particleCoords) {
    // only updates keypoints, assuming other properties aren't being used
    const placeholderBodies = [];
    let particleIndex = 0;
    for (const pbody of this.pbodies) {
      const placeholderBody = JSON.parse(JSON.stringify(pbody));
      for (let i = 0; i < placeholderBody.keypoints.length; i++) {
        placeholderBody.keypoints[i].x = particleCoords[particleIndex].x;
        placeholderBody.keypoints[i].y = particleCoords[particleIndex].y;
        particleIndex++;
      }
      //console.log(placeholderBody.keypoints);
      placeholderBodies.push(placeholderBody);
    }
    if (placeholderBodies.length > 0) {
      this.placeholderBodies = placeholderBodies;
    }
  }

  display(p5sketch) {
    // console.log(JSON.stringify(this.bodies))
    for (let body of this.bodies) {
      // console.log(body);
      p5sketch.push();
      const scaleX = (this.refSize / body.box.width) * this.size;
      const scaleY = (this.refSize / body.box.height) * this.size;
      p5sketch.scale(scaleX > scaleY ? scaleY : scaleX);
      const x = body.box.xMin + body.box.width / 2;
      const y = body.box.yMin + body.box.height / 2;
      p5sketch.translate(-p5sketch.width / 2 - x / 2, -p5sketch.height / 2 - y / 2);
      //this.drawKeypoints(p5sketch, body.keypoints, this.visibleIndices);
      this.drawKeypoints(p5sketch, body.keypoints);
      p5sketch.pop();
    }
  }

  smoothData(prevData, newData, prevScore, newScore, smoothness) {
    return (prevData * smoothness * prevScore + newData * (1 - smoothness) * newScore) / ((prevScore + newScore) / 2);
  }
  // only smoothes lips
  smoothBodies(pbodies, bodies, smoothness) {
    // todos:
    // [ ] add multi-body support
    // [ ] pair closest pbody and body
    // for (let i = 0; i < bodies.length; i++) {
    for (let i = 0; i < 1; i++) {
      // console.log(bodies);
      const body = bodies[i];
      const pbody = pbodies[i];
      const score = 1;
      const pscore = 1;
      const keypoints = body.keypoints;
      const pkeypoints = pbody.keypoints;
      for (let j = 0; j < keypoints.length; j++) {
        const keypoint = keypoints[j];
        const pkeypoint = pkeypoints[j];
        bodies[i].keypoints[j].x = this.smoothData(pkeypoint.x, keypoint.x, pscore, score, smoothness);
        bodies[i].keypoints[j].y = this.smoothData(pkeypoint.y, keypoint.y, pscore, score, smoothness);
      }
    }
    return bodies;
  }

  getBodyDiffScores(pbodies, bodies) {
    const diffScores = [];
    for (let i = 0; i < pbodies.length && i < bodies.length; i++) {
      const pbody = this.pbodies[i];
      const body = this.bodies[i];
      let diff = 0;
      const shortKeypointsLength = Math.min(body.keypoints.length, pbody.keypoints.length);
      for (let j = 0; j < shortKeypointsLength; j++) {
        const keypoint = body.keypoints[j];
        const pkeypoint = pbody.keypoints[j];
        const diffX = keypoint.x - pkeypoint.x;
        const diffY = keypoint.y - pkeypoint.y;
        diff += Math.sqrt(diffX * diffX + diffY * diffY);
      }
      diffScores.push(diff / shortKeypointsLength);
    }
    return diffScores;
  }

  //drawKeypoints(p5sketch, keypoints, visibleIndices) {
  drawKeypoints(p5sketch, keypoints) {
    // console.log('hello');
    p5sketch.push();
    // p5sketch.circle(0,0,100);
    // p5sketch.translate(-p5sketch.width/2, -p5sketch.height/2);
    // p5sketch.beginShape(p5sketch.TRIANGLE_STRIP);
    p5sketch.stroke(this.strokeColor);
    p5sketch.strokeWeight(this.strokeWeight * this.refSize);
    p5sketch.beginShape(p5sketch.POINTS);
    // for (let keypoint of keypoints) {
    for (let i = 0; i < keypoints.length; i++) {
      //for (let i of visibleIndices) {
      const keypoint = keypoints[i];
      p5sketch.vertex(keypoint.x, keypoint.y);
      // p5sketch.textSize(10);
      // p5sketch.textAlign(p5sketch.CENTER, p5sketch.CENTER);
      // p5sketch.fill(this.strokeColor);
      // p5sketch.text(i, keypoint.x, keypoint.y);
    }
    p5sketch.endShape();
    p5sketch.pop();
  }

  updateRefSize(canvasWidth, canvasHeight) {
    const canvasShort = p5sketch.min(canvasWidth, canvasHeight);
    this.refSize = canvasShort;
  }
}