/// <reference types="node" />
export interface HTTPRequest {
  env: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Buffer;
  path: string;
  method: string;
  requestId: string;
  headers: Record<string, string | string[]>;
}

export interface FunctionResponse {
  statusCode: number;
  headers: Record<string, string | undefined>;
  body: Buffer | string;
}

export interface HTTPResponse {
  userResponse: Partial<FunctionResponse>;
  new(userResponse: Partial<FunctionResponse>);
}

export interface HandlerContext {
  source: string;
  request: HTTPRequest;
  HTTPResponse: HTTPResponse;
  errorHandlerResponse: {
    RETRY: { action: 'RETRY' };
    DROP: { action: 'DROP' };
  };
}

export type Handler = (body: unknown, context: HandlerContext) => Promise<any>;
