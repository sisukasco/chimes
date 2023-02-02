import { RemoteConnection } from './request';
import { TokenProvider } from './token';
import Connection from './connection';

export default class Service implements RemoteConnection {
  private connection: Connection;

  constructor(
    public name: string,
    public endpoint: string,
    private tokenP?: TokenProvider
  ) {
    this.connection = new Connection(endpoint);
  }

  public async request(path: string, data: any = {}) {
    
    let opts = {};
    if (this.tokenP) {
      const token = await this.tokenP.getJWTAccessToken();
      opts = { headers: { Authorization: `Bearer ${token}` } };
    }

    try {
      const resp = await this.connection.request(path, { ...opts, ...data });
      return resp;
    } catch (err) {
      throw err;
    }
  }
}
