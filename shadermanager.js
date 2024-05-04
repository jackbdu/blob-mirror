class ShaderManager {
  constructor() {
    this.loopProgress = 0;
  }

  preload(loadShader, options) {
    this.shader = loadShader(options.paths.vert, options.paths.frag);
  }

  setup(graphics) {
    this.g = graphics;
  }

  update(options) {
    const frameCount = options?.frameCount ?? 0;
    const bpm = options?.bpm ?? 120;
    const mouseX = options?.mouseX ?? 0;
    const mouseY = options?.mouseY ?? 0;
    const pixelDensity = options?.pixelDensity ?? 1;
    const loopFramesNum = options?.loopFramesNum ?? 120;
    const pixelationShortNum = options?.pixelationShortNum ?? 16;
    const colorDepth = options?.colorDepth ?? 8;
    const bodyCoords = options?.bodyCoords ?? [];
    const drumMeterValue = options?.drumMeterValue ?? 0;
    const relativeAverageCoord = options?.relativeAverageCoord ?? { x: 0, y: 0 };
    const texture = options?.texture;

    const mode = relativeAverageCoord.x > 0 ? 1 : 0;

    this.loopProgress += bpm / 100000;
    this.loopProgress = this.loopProgress - Math.floor(this.loopProgress);
    this.shader.setUniform("uResolution", [this.g.width, this.g.height]);
    this.shader.setUniform("uPixelDensity", pixelDensity);
    this.shader.setUniform("uFrameCount", frameCount);
    this.shader.setUniform("uLoopFramesNum", loopFramesNum);
    this.shader.setUniform("uLoopProgress", this.loopProgress);
    this.shader.setUniform("uTexMap", texture);
    this.shader.setUniform("uTexDimensions", [texture.width, texture.height]);
    this.shader.setUniform("uColorDepth", colorDepth);
    this.shader.setUniform("uPixelationShortNum", pixelationShortNum);
    this.shader.setUniform("uBodyCoords", bodyCoords);
    this.shader.setUniform("uMode", mode);
  }

  draw(p = this.g) {
    // this.g.clear();
    // this.g.shader(this.shader);
    // this.g.noStroke();
    // this.g.rect(-this.g.width/2, -this.g.height/2, this.g.width, this.g.height);

    p.clear();
    p.push();
    p.shader(this.shader);
    p.noStroke();
    p.rect(-p5sketch.width / 2, -p5sketch.height / 2, p5sketch.width, p5sketch.height);

    // p.clear();
    // p.shader(this.shader);
    // p.noStroke();
    // p.beginShape();
    // p.vertex(0, -400, -1, 0);
    // p.vertex(-400, 0, -1, 0);
    // p.vertex(0, 400, 0, 1);
    // p.vertex(400, 200, 1, 1);
    // p.endShape();
    p.pop();

    return p;
  }

  canvasResized(canvasWidth, canvasHeight) {
    this.g.resizeCanvas(canvasWidth, canvasHeight);
  }
}
