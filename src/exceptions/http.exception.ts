class HttpException extends Error{
    public statusCode: number;
    public status: string;
    public message: string;
    public errors?: any[];

    constructor(statusCode:number,status:string,message:string,errors?:any[]){
        super(message)
        this.statusCode = statusCode;
        this.status = status;
        this.message = message
       
        this.errors = errors
        this.name = this.constructor.name;
        if(Error.captureStackTrace){
            Error.captureStackTrace(this,this.constructor)
        }
    }


}
export default HttpException;