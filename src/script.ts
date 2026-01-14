import { Dot } from "./Dot";
import { ToggleFullScreen } from "./FullScreen";

class Drawer {
  constructor(private ctx: CanvasRenderingContext2D) {}
  drawDot(dot: Dot, color = "#ff0000", radius = 5) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  clear() {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  fill(color: string) {
    const canvas = this.ctx.canvas;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  toDrawFigure(figure: Path2D) {
    const ctx = this.ctx;
    return function (
      dot: Dot,
      scale: number = 1,
      rotation: number = 0,
      color: string = "#fff",
      strokeStyle: string | null = "#000",
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

function FigureTriangle(config: { lat: number }): Path2D {
  const h = (Math.sqrt(3) / 2) * config.lat;
  const path = new Path2D();
  path.moveTo(0, h / -2);
  path.lineTo(config.lat / 2, h / 2);
  path.lineTo(config.lat / -2, h / 2);
  path.closePath();
  return path;
}
type DrawConfig = {
  lat: number;
  scaleNoise: boolean;
  stroke: boolean;
};

// function FigureSquare(config: { lat: number }): Path2D {
//   const path = new Path2D();
//   const halfL = config.lat / 2;
//   path.moveTo(halfL, halfL);
//   path.lineTo(halfL, -halfL);
//   path.lineTo(-halfL, -halfL);
//   path.lineTo(-halfL, halfL);
//   path.closePath();
//   return path;
// }

class Board {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawer: Drawer;
  dot: Dot;
  _config: DrawConfig;
  constructor(canvas: HTMLCanvasElement, dot: Dot, config?: Partial<DrawConfig>) {
    this.canvas = canvas;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;
    this.drawer = new Drawer(this.ctx);
    this.dot = dot.clone();
    this._config = {
      lat: 50,
      scaleNoise: true,
      stroke: true,
    };
    if(config) {
      this.setConfig(config);
    }
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  setConfig(config: Partial<DrawConfig>) {
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



window.onload = () => {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    throw new Error("Canvas element not found");
  }
  canvas.addEventListener("dblclick", ToggleFullScreen);
  const dot = new Dot(100, 150);
  const board = new Board(canvas as HTMLCanvasElement, dot, {
    lat: 60,
    scaleNoise: !!1,
    stroke: !!0,
  });

  hookConfig(board);
};

function hookConfig(board: Board) {
  console.log("hookConfig");
  const configElement = document.getElementById("config");
  if (!configElement) {
    throw new Error("Config element not found");
  }
  const configForm = configElement.querySelector(".config_content");
  const applyButton = configElement.querySelector("#config_apply");
  const i = configElement.querySelector(".config_trigger");
  if (!configForm || !applyButton || !i) {
    throw new Error("Config form elements not found");
  }

  i.addEventListener("click", function () {
    configElement.classList.toggle("config_opened");
  });

  function getInput(parent: Element, query: string) : HTMLInputElement {
    const input = parent.querySelector(query);
    if(!input) {
      throw new Error(`Input element not found: ${query}`);
    }
    return input as HTMLInputElement;
  }



  // // sync
  const config = board.getConfig();
  const scaleNoice: HTMLInputElement =
    getInput(configForm, "input[name='scaleNoise']");
  const stroke: HTMLInputElement =
    getInput(configForm, "input[name='stroke']");
  const lat: HTMLInputElement =
    getInput(configForm, "input[name='lat']");
  if(!scaleNoice || !stroke || !lat) {
    throw new Error("Config form inputs not found");
  }

  scaleNoice.checked = config.scaleNoise;
  stroke.checked = config.stroke;
  lat.value = config.lat.toString();

  // @TODO make config module to avoid this manual sync
  // @TODO add vertical input sync
  
  // // lat.dispatchEvent(new Event("input", { bubbles: true }));

  // applyButton.addEventListener("click", () => {
  //   const formData = new FormData(configForm as HTMLFormElement);
  //   const config = {
  //     lat: parseInt(lat.value, 10),
  //     scaleNoise: formData.get("scaleNoise") === "on",
  //     stroke: formData.get("stroke") === "on",
  //   };
  //   board.setConfig(config);
  //   board.redraw();
  // });

  // const lat: HTMLInputElement = getInput(configForm, "input[name='lat']");


  const latInput = new Input(lat, "range", {
    min: 5,
    max: 200,
    step: 1,
    value: board.getConfig().lat,
  });
  latInput.updateValue(board.getConfig().lat.toString());

  // latInput.element.addEventListener("input", () => {
  //   const newLat = parseInt(latInput.element.value, 10);
  //   board.setConfig({ lat: newLat });
  //   board.redraw();
  // });

  // latInput.updateValue(board.getConfig().lat.toString());

  applyButton.addEventListener("click", () => {
    const scaleNoiseInput = getInput(configForm, "input[name='scaleNoise']");
    const strokeInput = getInput(configForm, "input[name='stroke']");

    const newConfig: Partial<DrawConfig> = {
      lat: parseInt(latInput.element.value, 10),
      scaleNoise: scaleNoiseInput.checked,
      stroke: strokeInput.checked,
    };
    board.setConfig(newConfig);
    board.redraw();
  });
}

type InputType = "range" | "checkbox";
type InputParams = {
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  checked?: boolean;
};

class Input {
  public element: HTMLInputElement;
  public type: InputType;

  constructor(element: HTMLInputElement, type: InputType, params = {}) {
    this.element = element;
    this.type = type;
    this.applyParams(params);
  }
  applyParams(params: InputParams) {
    switch (this.type) {
      case "range":
        this.element.type = "range";
        this.element.setAttribute("min", params.min ? params.min.toString() : "5");
        this.element.setAttribute("max", params.max ? params.max.toString() : "500");
        this.element.setAttribute("step", params.step ? params.step.toString() : "5");
        this.element.setAttribute(
          "oninput",
          "this.nextElementSibling.value = this.value",
        );
        this.element.value = params.value ? params.value.toString() : "0";
        break;
      case "checkbox":
        this.element.checked = params.checked || false;
        break;
      default:
        console.warn(`Unsupported input type: ${this.type}`);
        break;
    }

    for (const _key in params) {
      const key = _key as keyof InputParams;
      const value = params[key]?.toString() || "";

      this.element.setAttribute(key, value);
    }
  }
  updateValue(value: string) {
    switch (this.type) {
      case "range":
        this.element.value = value;
        // this.element.dispatchEvent(new Event("input", { bubbles: true}));
        break;
      case "checkbox":
        this.element.checked = value  === "true";
        break;
      default:
        console.warn(`Unsupported input type: ${this.type}`);
        break;
    }
  }
}
