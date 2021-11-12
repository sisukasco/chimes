import {RemoteConnection} from './request';
import {TokenProvider} from './token';
import Connection from "./connection";

export default class Service implements RemoteConnection
{
    private connection:Connection;
    
    constructor(public name:string, 
        public endpoint:string, 
        private tokenP?: TokenProvider)
        {
            this.connection = new Connection(endpoint)
        }
        
     public async request(path: string, data:any={})
     {
        try{
            let opts = {}
            if(this.tokenP)
            {
                const token = await this.tokenP.getJWTAccessToken()
                if(token === ""){
                    Promise.reject(new Error("Failed logging in ") )
                }
                
                opts = { headers:{Authorization: `Bearer ${token}` } }                
            }
            
            const resp = await this.connection.request(path, {...opts, ...data})  
            return resp;          
        }catch(err){
            throw err
        }
    }
    
}