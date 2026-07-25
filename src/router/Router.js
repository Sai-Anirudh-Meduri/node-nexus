export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler,
    });
  }

  get(path, handler) {
    this.register("GET", path, handler);
  }

  post(path, handler) {
    this.register("POST", path, handler);
  }

  async handle(request, response) {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    const route = this.routes.find(
      (currentRoute) =>
        currentRoute.method === request.method &&
        currentRoute.path === url.pathname,
    );

    if (!route) {
      return false;
    }

    await route.handler(request, response);

    return true;
  }
}