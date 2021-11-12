export interface RemoteConnection{
    request(path:string, data:any):Promise<any>
}
