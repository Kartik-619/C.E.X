// src/api/routes/route.interface.ts

export interface AppRouter {
    get(path: string, handler: (req: Request) => Promise<Response> | Response): void;
    post(path: string, handler: (req: Request) => Promise<Response> | Response): void;
    delete(path: string, handler: (req: Request) => Promise<Response> | Response): void;
    all?(path: string, handler: (req: Request) => Promise<Response> | Response): void;
}

export interface RouteModule {
    register(router: AppRouter): void;
}