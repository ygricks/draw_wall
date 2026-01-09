class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  clone() {
    return new Dot(this.x, this.y);
  }
}

class Drawer {
  constructor(ctx) {
    this.ctx = ctx;
  }
  drawDot(dot, color = "#ff0000", radius = 5) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  clear() {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  fill(color) {
    const canvas = this.ctx.canvas;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  toDrawFigure(figure) {
    const ctx = this.ctx;
    return function (
      dot,
      scale = 1,
      rotation = 0,
      color = "#fff",
      strokeStyle = "#000",
    ) {
      ctx.save();
      ctx.translate(dot.x, dot.y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      ctx.fillStyle = color;
      ctx.fill(figure);
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke(figure);
      }
      ctx.restore();
    };
  }
}

function FigureTriangle(config) {
  const h = (Math.sqrt(3) / 2) * config.lat;
  const path = new Path2D();
  path.moveTo(0, h / -2);
  path.lineTo(config.lat / 2, h / 2);
  path.lineTo(config.lat / -2, h / 2);
  path.closePath();
  return path;
}

function FigureSquare(config) {
  const path = new Path2D();
  const halfL = config.lat / 2;
  path.moveTo(halfL, halfL);
  path.lineTo(halfL, -halfL);
  path.lineTo(-halfL, -halfL);
  path.lineTo(-halfL, halfL);
  path.closePath();
  return path;
}

class Board {
  constructor(canvas, dot, config = undefined) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.drawer = new Drawer(this.ctx);
    this.dot = dot.clone();
    this._config = {
      lat: 50,
      scaleNoise: true,
      stroke: true,
    };
    this.setConfig(config);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  setConfig(config) {
    if (!config) {
      return;
    }
    if (config.lat !== undefined) {
      this._config.lat = config.lat;
    }
    if (config.scaleNoise !== undefined) {
      this._config.scaleNoise = config.scaleNoise;
    }
    if (config.stroke !== undefined) {
      this._config.stroke = config.stroke;
    }
  }

  getConfig() {
    return structuredClone(this._config);
  }

  getCanvasSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  redraw() {
    const config = this.getConfig();
    const size = this.getCanvasSize();
    const drawer = this.drawer;

    // drawer.clear();
    drawer.fill("#000000");

    const figure = FigureTriangle(config);
    // const figure = FigureSquare(config);
    const drawFigure = drawer.toDrawFigure(figure);

    const halfL = config.lat / 2;
    const h = (Math.sqrt(3) / 2) * config.lat;

    const xCount = Math.ceil(size.width / halfL) + 1;
    const yCount = Math.ceil(size.height / h) + 1;

    for (let y = 0; y <= yCount; y++) {
      for (let x = 0; x <= xCount; x++) {
        const def = (x + y) % 2;
        const r = Math.random();
        const scale = config.scaleNoise ? r * 0.3 + 0.7 : 1;
        const color = `hsl(${Math.random() * 360},${Math.random() * 100}%,${r * 80 + 10}%)`;
        // const color = `hsl(0,0%,${r * 80 + 10}%)`;

        drawFigure(
          new Dot(x * halfL, y * h),
          scale,
          def * Math.PI,
          color,
          config.stroke ? "#000000" : null,
        );
      }
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.redraw();
  }
}

// full screen toggle
function triggerFullScreen() {
  if (document.body.fullScreen) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
  document.body.fullScreen = !document.body.fullScreen;
}

// catch vertical swipe events
function swipeVerticalEventListener(target) {
  let touchStartY = 0;

  target.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  target.addEventListener(
    "touchend",
    (e) => {
      const touchEndY = e.changedTouches[0].screenY;
      const distance = touchStartY - touchEndY;

      if (Math.abs(distance) > 50) {
        const eventType = distance > 0 ? "swipeup" : "swipedown";
        triggerSwipe(target, eventType, distance);
      }
    },
    { passive: true },
  );

  function triggerSwipe(target, eventType, distance) {
    const swipeEvent = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: true,
      detail: { distance: distance },
    });
    target.dispatchEvent(swipeEvent);
  }
}

window.onload = () => {
  const canvas = document.getElementById("canvas");
  canvas.addEventListener("dblclick", triggerFullScreen);
  const dot = new Dot(100, 150);
  const board = new Board(canvas, dot, {
    lat: 60,
    scaleNoise: 1,
    stroke: 0,
  });

  hookConfig(board);

  // function change(direction) {
  //   const initialLat = board._config.lat;
  //   let lat = board._config.lat + (direction === "up" ? 5 : -5);
  //   lat = Math.max(10, lat);
  //   lat = Math.min(60, lat);
  //   if (lat === initialLat) {
  //     return;
  //   }
  //   board._config.lat = lat;
  //   board.redraw();
  // }
  // swipeVerticalEventListener(canvas);
  // canvas.addEventListener("swipeup", (e) => {
  //   change("up");
  // });
  // canvas.addEventListener("swipedown", (e) => {
  //   change("down");
  // });

  // // sync data / params, define params once
  // const newInputElement = document.createElement("input");
  // new Input(newInputElement, "range", {
  //   min: 10,
  //   max: 200,
  //   step: 10,
  //   value: 50,
  // });
  // document.body.appendChild(newInputElement);
};

function hookConfig(board) {
  const configElement = document.getElementById("config");
  const configForm = configElement.querySelector(".config_content");
  const applyButton = configElement.querySelector("#config_apply");
  const i = configElement.querySelector(".config_trigger");

  // sync
  const config = board.getConfig();
  configForm.querySelector("input[name='scaleNoise']").checked =
    config.scaleNoise;
  configForm.querySelector("input[name='stroke']").checked = config.stroke;
  const latRange = configForm.querySelector("input[name='lat']");
  latRange.value = config.lat;
  latRange.dispatchEvent(new Event("input", { bubbles: true }));

  i.addEventListener("click", function () {
    configElement.classList.toggle("config_opened");
  });

  applyButton.addEventListener("click", () => {
    const formData = new FormData(configForm);
    const config = {
      lat: parseInt(formData.get("lat"), 10),
      scaleNoise: formData.get("scaleNoise") === "on",
      stroke: formData.get("stroke") === "on",
    };
    board.setConfig(config);
    board.redraw();
  });
}

class Input {
  constructor(element, type, params = {}) {
    console.log(element);
    this.element = element;
    this.type = type;
    this.applyParams(params);
  }
  applyParams(params) {
    console.log(this.element);
    switch (this.type) {
      case "range":
        this.element.type = "range";
        this.element.setAttribute("min", params.min || 5);
        this.element.setAttribute("max", params.max || 500);
        this.element.setAttribute("step", params.step || 5);
        this.element.setAttribute(
          "oninput",
          "this.nextElementSibling.value = this.value",
        );
        this.element.value = params.value || 0;
        break;
      case "checkbox":
        this.element.checked = params.checked || false;
        break;
      default:
        console.warn(`Unsupported input type: ${this.type}`);
        break;
    }

    for (const key in params) {
      this.element.setAttribute(key, params[key]);
    }
  }
  updateValue(value) {
    switch (this.type) {
      case "range":
        this.element.value = value;
        // this.element.dispatchEvent(new Event("input", { bubbles: true}));
        break;
      case "checkbox":
        this.element.checked = value;
        break;
      default:
        console.warn(`Unsupported input type: ${this.type}`);
        break;
    }
  }
}
