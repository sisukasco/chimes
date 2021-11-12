
import qs from 'qs';
import User, {TokenResponse} from './user';
import Connection from "./connection";
import {RemoteConnection} from './request';
import {LoginObserver} from './observer';
import Service from "./service"


export default class Chimes{
    private auth_connection: Connection;
    public user:User|null=null;
    private interestedLogin:LoginObserver|null=null;
    
    constructor(auth_url?:string, aud?:string){
        if(!aud){
            aud=""
        }
        
        this.auth_connection = new Connection(auth_url||'')
        
        this.user = User.loadFromStorage(this.auth_connection)
    }
    
    public get loggedIn():boolean{
        return(this.user ? true: false);
    }
    
    public async signup(email: string, password: string, data={}) {
        return this.auth_connection.request('/signup',{
            method: 'post',
            data: {email,password,data}
            })
    }
    public async resetPassword(token:string, password: string){
        try{
            const res = await this.auth_connection.request('/reset/update',{
                method: 'post',
                data: {token, password}
                })            
            console.log("resetPassword res ", res);
            return res;
        }
        catch(err){
            throw err;    
        }

        return true;
    }
    public async forgot(email: string){
        try{
            const res = await this.auth_connection.request('/reset/init',{
                method: 'post',
                data: {email}
                })            
            console.log("forgot res ", res);
            return res;
        }
        catch(err){
            throw err;    
        }

        return true;
    }
    public async updateEmail(token: string){
        try{
            const res = await this.auth_connection.request('/email/update',{
                method: 'post',
                data: {token}
                })            
            console.log("confirm res ", res);
            if(this.user){
                await this.user.loadUserData()
            }
            return res;
        }
        catch(err){
            throw err;    
        }

        return true;
    }
    public async confirm(code: string){
        try{
            const res = await this.auth_connection.request('/confirm',{
                method: 'post',
                data: {code}
                })            
            console.log("confirm res ", res);
            if(this.user){
                await this.user.loadUserData()
            }
            return res;
        }
        catch(err){
            throw err;    
        }

        return true;
    }
    public letMeKnow(me:LoginObserver){
     this.interestedLogin = me;   
    }
    public async login(email: string, password: string) {
        try{
            const tok = await this.auth_connection.request('/token',{
                    method:'post',
                    data:qs.stringify({
                        grant_type: "password",
                        username: email,
                        password: password
                    }),
                    headers: {
                    'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                    }
                })
            await this.initUser(tok)
            if(this.interestedLogin)
            {
                this.interestedLogin.onLogin();
            }
            return { ok:true };
        }
        catch(err){
            console.log(" error caught in login ", err)
            const e ={
                msg : err.error_description , 
                code: 400//TODO; get the correct error code in connection error handler
            };
            throw e;
        }
    }
    
    public logout(){
        User.clearSession();
        this.user = null
    }
    
    private  async initUser(tok:TokenResponse){
        try{
            const u = new User(this.auth_connection, tok);
            await u.loadUserData();
            this.user = u;
            return u;            
        }
        catch(err){
            throw err
        }

    }
    public externalLoginRedirect(provider:string){
        this.auth_connection.redirectTo("/authorize", {provider})
    }
    public async handleExternalLogin(ticket: string){
        try{
            const strToken = atob( ticket )
            if(!strToken){
                throw new Error("token is empty!")
            }
            const tokenobj = JSON.parse(strToken);
            if(!tokenobj){
                throw new Error("Can't parse token object")
            }
            return this.initUser(tokenobj)
        }
        catch(err)
        {
            throw err;
        }
        
    }
    
    public getService(name:string,endpoint:string):RemoteConnection{
        
        return new Service(name, endpoint)
    }
    
    public getAuthService():RemoteConnection|null{
        return this.user
    }
    
    public getAPIService(name:string):RemoteConnection|null{
        if(!this.user)
        {
            return null
        }
        return this.user.createService(name)
    }
    
    
}