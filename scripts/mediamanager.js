class MediaManager {
  constructor(p5sketch) {
    this.graphics = undefined;
    this.image = undefined;
    this.loaded = false;
  }

  preload(p5sketch, options = {}) {
    this.path = options?.path;
    this.type = options?.type ?? "image";
    if (this.path && this.type === "image") {
      this.image = p5sketch.loadImage(this.path);
    }
  }

  setup(p5sketch, options = {}) {
    const width = options?.width ?? 64;
    const height = options?.height ?? 64;
    const flipped = options?.flipped ?? false;
    const onLoaded =
      options?.onLoaded ??
      function () {
        if (this.type === "video" && this.image) {
          this.loaded = true;
          this.image.loop();
        }
      }.bind(this);
    this.graphics = p5sketch.createGraphics(width, height);
    if (this.path && this.type === "video") {
      this.image = p5sketch.createVideo(this.path, onLoaded);
    } else if (this.type === "capture") {
      this.image = p5sketch.createCapture(p5sketch.VIDEO, { flipped }, () => {
        this.loaded = true;
        onLoaded();
      });
      this.image.hide();
    } else {
      this.loaded = true;
      onLoaded();
    }
  }

  update(options = {}) {
    this.graphics.image(this.image, 0, 0, this.graphics.width, this.graphics.height, 0, 0, this.image.width, this.image.height, options.fit);
  }

  canvasResized(width, height) {
    if (this.graphics) this.graphics.resizeCanvas(width, height);
  }
}
