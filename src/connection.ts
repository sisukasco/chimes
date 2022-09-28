import {joinURL} from './chime-utils';
import axios, {AxiosInstance, AxiosAdapter} from 'axios';
import qs from 'qs';

import { throttleAdapterEnhancer } from 'axios-extensions';

export default class Connection
{
    private http:AxiosInstance
    constructor(
        private api_url:string)
    {
        //The current setup only prevents frequent request to the same end point
        // This works for now.
        //To add traditional caching, use cacheAdapterEnhancer as well
        this.http = axios.create({
            adapter: throttleAdapterEnhancer(axios.defaults.adapter as AxiosAdapter, { threshold: 3 * 1000 } )
        }); 
    }  
    
    private fullUrl(path: string){
        return joinURL(this.api_url, path)
    }
    
    public redirectTo(path:string, params:any){
        if(window && window.location){
            window.location.href = this.fullUrl(path)+"?"+qs.stringify(params)    
        }
    }
    
    public async request(path:string, options:any){
        const defaults = { url: this.fullUrl(path), withCredentials: true }
        console.log("new cached req ")
        return this.http({...options, ...defaults})
                    .then((resp)=>
                    {
                        return Promise.resolve(resp.data)
                    })
                    .catch((err)=>{
                        return Promise.reject(err.response.data)    
                    })
        
    }
        
}