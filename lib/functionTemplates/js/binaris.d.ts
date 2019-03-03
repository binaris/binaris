/// <reference types="node" />
interface BinarisHTTPRequest {
  env: Record<string, string | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: Buffer;
  path: string;
  method: string;
  requestId: string;
  headers: Record<string, string | string[] | undefined>;
}

interface FunctionResponse {
  statusCode: number;
  headers: Record<string, string | undefined>;
  body: Buffer | string;
}

declare class BinarisHTTPResponse implements FunctionResponse {
  userResponse: Partial<FunctionResponse>;
  constructor(userResponse: Partial<FunctionResponse>);
  statusCode: number;
  headers: Record<string, string | undefined>;
  body: Buffer | string;
}

declare type FunctionContext = {
  request: BinarisHTTPRequest;
  HTTPResponse: typeof BinarisHTTPResponse;
};

export declare type BinarisFunction = (body: unknown, context: FunctionContext) => Promise<any>
