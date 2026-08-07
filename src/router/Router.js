function matchPath(routePath, requestPath) {
  const routeParts = routePath.split("/").filter(Boolean);
  const requestParts = requestPath.split("/").filter(Boolean);

  if (routeParts.length !== requestParts.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const requestPart = requestParts[index];

    if (routePart.startsWith(":")) {
      const parameterName = routePart.slice(1);
      params[parameterName] = decodeURIComponent(requestPart);
      continue;
    }

    if (routePart !== requestPart) {
      return null;
    }
  }

  return params;
}

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

  delete(path, handler) {
    this.register("DELETE", path, handler);
  }

  async handle(request, response) {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    for (const route of this.routes) {
      if (route.method !== request.method) {
        continue;
      }

      const params = matchPath(route.path, url.pathname);

      if (params === null) {
        continue;
      }

      request.params = params;
      request.query = Object.fromEntries(url.searchParams);

      await route.handler(request, response);

      return true;
    }

    return false;
  }
}