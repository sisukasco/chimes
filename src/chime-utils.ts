
export function joinURL(base: string, path:string){
    const url = new URL(path,base).href
    return url
}

export function isBrowser(){
    return(typeof(window) !== "undefined")
}