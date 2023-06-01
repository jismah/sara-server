let instance: responseProcessor;

class responseProcessor {
    constructor() {
        if (instance) {
            throw new Error("New instance of responseProcessor cannot be created");
        }
        
        instance = this;
    } 

    newMessage(code: Number, message: string | undefined) {
        return { status: this.getStatus(code), code: code, response: {message: message}}
    }

    concatStatus(code: Number, json: any) {
        let res = {code: code, status: this.getStatus(code), response: json}
        return res;
    }

    getStatus(code: Number) {
        let status;
        if (code == 200) {
            status = 'SUCCESS';
        } else {
            status = 'ERROR';
        }
        return status;
    }
}

let resProcessor = new responseProcessor();
export default resProcessor;