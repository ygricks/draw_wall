enum SwipeEventType {
  SwipeUp = "swipeup",
  SwipeDown = "swipedown",
};

function swipeVerticalEventListener(target: HTMLElement) {
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
        const eventType = distance > 0
          ? SwipeEventType.SwipeUp
          : SwipeEventType.SwipeDown;
        triggerSwipe(target, eventType, distance);
      }
    },
    { passive: true },
  );

  function triggerSwipe(target: HTMLElement, eventType: SwipeEventType, distance: number) {
    const swipeEvent = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: true,
      detail: { distance: distance },
    });
    target.dispatchEvent(swipeEvent);
  }
}


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
  