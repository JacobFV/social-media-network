// class RouterAndAPIBase<Context> {
//   subrouter(path: string): Router<Context> {
//     return class extends Router<Context> {
//       path = path;
//     } as unknown as Router<Context>;
//   }
// }
// export class Api<Context> extends RouterAndAPIBase<Context> {
//   protected readonly ctxGenerator: () => Context;
// }
// export class Router<Context> extends RouterAndAPIBase<Context> {
//   public path: string;
// }

// export async function API(path?: string) {
//   // make the following changes tho the annotated class:
//   // mount???
// }

export class Server {
  express: Express;

  Router(path: string) {
    // decorate the following class by reaching into its methods and registering those as routes
    // multilevel routing
    // inject support for the auth directives annotations
  }

  registerRoutesFromObject(object: object, options: { prefix?: string }) {
    // decorate the following class by reaching into its methods and registering those as routes
  }
}

export async function GET(path?: string) {
  // add metadata to the annotated method to indicate that it is a GET route
}

export async function POST(path?: string, body?: any) {
  // add metadata to the annotated method to indicate that it is a POST route
}

export async function PUT(path?: string, body?: any) {
  // add metadata to the annotated method to indicate that it is a PUT route
}

export async function DELETE(path?: string) {
  // add metadata to the annotated method to indicate that it is a DELETE route
}

export async function PATCH(path?: string, body?: any) {
  // add metadata to the annotated method to indicate that it is a PATCH route
}

export async function OPTIONS(path?: string) {
  // add metadata to the annotated method to indicate that it is a OPTIONS route
}

export async function HEAD(path?: string) {
  // add metadata to the annotated method to indicate that it is a HEAD route
}

export async function TRACE(path?: string) {
  // add metadata to the annotated method to indicate that it is a TRACE route
}

export async function CONNECT(path?: string) {
  // add metadata to the annotated method to indicate that it is a CONNECT route
}
