/// <reference types="node" />
export interface HTTPRequest {
  env: Record<string, string | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: Buffer;
  path: string;
  method: string;
  requestId: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface HTTPResponseParams {
  statusCode?: number;
  headers?: Record<string, string | undefined>;
  body?: Buffer | string;
}

export interface HTTPResponse {
  new(response: HTTPResponseParams);
}

export interface Context {
  source: string;
  request: HTTPRequest;
  HTTPResponse: HTTPResponse;
  errorHandlerResponse: {
    RETRY: { action: 'RETRY' };
    DROP: { action: 'DROP' };
  };
}

export type Handler = (body: unknown, context: Context) => Promise<any>;
