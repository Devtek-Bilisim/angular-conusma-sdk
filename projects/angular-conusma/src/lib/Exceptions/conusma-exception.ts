export class ConusmaException extends Error {
    constructor(_type:string,_message:string,_ex?:Error)
    {
        super();
        this.message = _message;
        this.type = _type;
        if(_ex != null)
        {
           
            this.detailEx = _ex.message;
        }
        Object.setPrototypeOf(this, ConusmaException.prototype);
    };
    public detailEx:string=""; 
    public message:string="";
    public type:string="";
    public className:string=""; 
}