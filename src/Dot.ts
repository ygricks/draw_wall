export class Dot {
  constructor(public x: number, public y: number) {}
  clone() {
    return new Dot(this.x, this.y);
  }
}
