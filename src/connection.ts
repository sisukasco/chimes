import { joinURL } from './chime-utils';
import qs from 'qs';

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
          console.log('Encoded body:', mergedOptions.body);
          (mergedOptions.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
          mergedOptions.body = JSON.stringify(data);
        }
      }
    }

    try {
      const response = await fetch(url, mergedOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.log("Caught error in chimes request", err);
      throw err;
    }
  }
}