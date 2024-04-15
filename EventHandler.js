class EventHandler {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }

  trigger(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb(...args));
    }
  }
}

export default EventHandler;
