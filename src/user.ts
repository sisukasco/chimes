import {isBrowser} from "./chime-utils"
import Connection from "./connection";
import {RemoteConnection} from './request';
import qs from 'qs';
import {atob} from 'b2a';
import Service from "./service"
import { InvalidToken } from "./error";

const storageKey = "chimes.user"

type ServiceEndPoints={
    [name: string]: string;
}

export type TokenResponse={
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
}
export type UserInfo ={
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
    email_confirmed: boolean;
    paid_user: boolean;
    endpoints: ServiceEndPoints;
}


type UserData={
    token: TokenResponse;
    info: UserInfo|null;
}


export default class User implements RemoteConnection
{
    public info: UserInfo|null=null
    
    constructor(private connection: Connection, 
                private token: TokenResponse)
    {
        this.processTokenResponse(token)
    }
    
    private processTokenResponse(tok: TokenResponse){
        this.token = tok;
        let claims
        try {
          claims = JSON.parse(atob(tok.access_token.split(".")[1]));
          this.token.expires_at = claims.exp * 1000;
        } catch (e) {
          console.error(new Error(`Failed to parse tokenResponse claims: ${JSON.stringify(tok)} error: ${e}`))
        }   
    }
    
    public saveSession(){
        if(isBrowser()){
            const u: UserData={
                token:this.token,
                info: this.info
            }
            localStorage.setItem(storageKey, JSON.stringify(u));
        }
    }
    public static clearSession(){
        //TODO: call logout end point
        localStorage.removeItem(storageKey)
    }
    public static loadFromStorage(connection: Connection): User|null{
        if(!isBrowser()){
            return null
        }
        const strUser = localStorage.getItem(storageKey)
        if(!strUser){
            return null;
        }
        const userData = JSON.parse(strUser)
        if(!userData || !userData.token){
            return null;
        }
        const u = new User(connection, userData.token)
        u.info = userData.info;
        return u;
    }
    
    public async getJWTAccessToken(): Promise<string> {
        const ExpiryMargin = 60 * 1000;
        let access_token =""
        if((this.token.expires_at - ExpiryMargin) < Date.now()){
            access_token =  await this.renewRefreshToken(this.token.refresh_token)
        }else{
            access_token  = this.token.access_token;
        }
        if(!access_token){
            throw new InvalidToken("Invalid access token")
        }

        return access_token
    }

    public async loadUserData(){
        try{
            this.info = await this.request("/user")
            this.saveSession();
            return this.info;
        }
        catch(err)
        {
            throw err;             
        }
    }
    
    public async request(path: string, data: any={}){
        try{
            const token = await this.getJWTAccessToken()
            if(token === ""){
                Promise.reject(new Error("Failed logging in ") )
            }
            const opts = { headers:{Authorization: `Bearer ${token}` } }
            
            const resp = await this.connection.request(path, {...opts, ...data})  
            return resp;          
        }catch(err){
            return Promise.reject(err)
        }
    }
    
    public async updatePassword(old: string, newPwd: string){
        try{
            const res = await this.request('/user/update/password',{
                method:'post',
                data: { old, "new":newPwd }
            })
            return res;
        }
        catch(e)
        {
           throw e; 
        }
    }
    
    public async saveProfileField(field_name: string, value: string){
        try{
            const res = await this.request('/user/profile',{
                method:'post',
                data: { name:field_name, value }
            })
            if(field_name == "first_name" ||
              field_name == "last_name" ||
              field_name == "email")
              {
                if(this.info){
                    this.info[field_name] = value;
                }
                
                this.saveSession()
              }
            return res;
        }
        catch(e)
        {
           throw e; 
        }
    }

    public async resendConfirmationEmail(){
        try{
            const res = await this.request('/user/resend/conf/email',{
                method:'post',
                data: { token:"66hrty"}
            })
            return res;       
        }
        catch(e)
        {
           throw e; 
        }

    }
    private async renewRefreshToken(refresh_token: string){
        let newToken: any = {}
        try{
            newToken = await this.connection.request('/token',{
                method:'post',
                data: qs.stringify({
                    grant_type: "refresh_token",
                    refresh_token: refresh_token
                }),
                headers: {
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            })
        }catch(err){
            this.info=null
            throw new InvalidToken("Error trying to renew refresh token." + err)
        }

        if(newToken.access_token){
            this.token = newToken
            this.saveSession()
            return newToken.access_token
        }else{
            this.info=null
            throw new InvalidToken("Received empty access token from the server while renewing refresh token.")
        }
    }
    
    public createService(name: string): Service|null{
        if(this.info && this.info.endpoints[name])
        {
            return new Service(name, this.info.endpoints[name], this)
        }
        return null
    }
}