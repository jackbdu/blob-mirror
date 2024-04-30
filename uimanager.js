class UiManager {
  constructor(options) {
    this.textStyle = options?.textStyle ?? 0;
    this.textFill = options?.textFill ?? 255;
    this.textStroke = options?.textStroke ?? 0;
    this.textStrokeWeight = options?.textStrokeWeight ?? 2;
    this.messages = {};
    this.messages.loading = options?.messages?.loading ?? "loading...";
    this.messages.loaded = options?.messages?.loaded ?? "loaded!";
    this.messages.started = options?.messages?.started ?? "";
    this.showFrameRate = options?.showFrameRate ?? false;
    this.messageKey = "loading";
  }

  preload(p5sketch, options = {}) {
    this.fontUrl = options?.fontUrl;
    if (this.fontUrl) {
      this.textFont = p5sketch.loadFont(this.fontUrl);
    } else {
      this.textFont = options?.textFont ?? "Ubuntu";
    }
  }

  setup(p5canvas, options = {}) {
    this.p5canvas = p5canvas;
  }
  update(allLoaded, allStarted) {
    if (this.messageKey === "loading" && allLoaded) {
      this.messageKey = "loaded";
    }
    if (this.messageKey === "loaded" && allStarted) {
      this.messageKey = "started";
    }
  }
  display(p5sketch) {
    this.displayMessage(p5sketch);
  }
  displayMessage(p5sketch) {
    const refSize = Math.min(p5sketch.width, p5sketch.height);
    const message = this.messages[this.messageKey];
    const textSize = refSize / (message.length + 1);
    p5sketch.push();
    if (!this.fontUrl) p5sketch.translate(p5sketch.width / 2, p5sketch.height / 2);
    p5sketch.textFont(this.textFont);
    p5sketch.textSize(textSize);
    p5sketch.textStyle(this.textStyle);
    p5sketch.textAlign(p5sketch.CENTER, p5sketch.CENTER);
    p5sketch.fill(this.textFill);
    p5sketch.stroke(this.textStroke);
    p5sketch.strokeWeight(this.textStrokeWeight);
    p5sketch.text(message, 0, 0);
    // console.log(message);
    if (this.showFrameRate) {
      const frameRateTextSize = refSize / 16;
      p5sketch.textSize(frameRateTextSize);
      p5sketch.fill(255, 200);
      p5sketch.text(p5sketch.floor(p5sketch.frameRate()), 0, 100);
    }
    p5sketch.pop();
  }
  // mousePressed() {
  //   if (this.messageKey === 'loaded') {
  //     this.messageKey = 'started';
  //   }
  // }
}
