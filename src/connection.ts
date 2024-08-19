import { joinURL } from './chime-utils';
import qs from 'qs';

interface ErrorResponse {
  msg?: string;
  error?: string;
  [key: string]: any;
}

export class RequestError extends Error {
  status: number;
  data: ErrorResponse;
  msg: string="";

  constructor(message: string, status: number, data: ErrorResponse) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.data = data;
    this.msg=data.msg?data.msg:"";
  }
}

export default class Connection {
  constructor(private api_url: string) {}

  private fullUrl(path: string) {
    return joinURL(this.api_url, path);
  }

  public redirectTo(path: string, params: any) {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = this.fullUrl(path) + "?" + qs.stringify(params);
    }
  }

  public async request(path: string, options: RequestInit & { data?: any }): Promise<any> {
    let url = this.fullUrl(path);
    const { data, ...fetchOptions } = options;

    const defaultOptions: RequestInit = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const mergedOptions: RequestInit = { ...defaultOptions, ...fetchOptions };

    if (data) {
      if (mergedOptions.method === 'GET') {
        const queryString = qs.stringify(data);
        url += (url.includes('?') ? '&' : '?') + queryString;
      } else {
        const contentType = (mergedOptions.headers as Record<string, string>)['content-type'] || 
                            (mergedOptions.headers as Record<string, string>)['Content-Type'];
        
        if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
          mergedOptions.body = qs.stringify(data);
          (mergedOptions.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
          mergedOptions.body = JSON.stringify(data);
        }
      }
    }

    try {
      const response = await fetch(url, mergedOptions);
      console.log("response from fetch" )
      console.dir(response, { depth: null });
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log("response data: ")
      console.dir(responseData, { depth: null });

      if (!response.ok) {
        throw new RequestError(
          responseData.msg || responseData.error || 'An error occurred',
          response.status,
          responseData
        );
      }
      
      return responseData;
    } catch (err) {
      if (err instanceof RequestError) {
        throw err;
      }
      console.log("Caught error in chimes request", err);
      throw new RequestError('An unexpected error occurred', 500, { msg: err instanceof Error ? err.message : String(err) });
    }
  }
}