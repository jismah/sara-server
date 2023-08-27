let instance: responseProcessor;

class responseProcessor {
    constructor() {
        if (instance) {
            throw new Error("New instance of responseProcessor cannot be created");
        }
        
        instance = this;
    } 

    newMessage(code: number, message: string | undefined) {
        return { status: this.getStatus(code), code: code, response: {message: message}}
    }

    concatStatus(code: number, json: any, total?: Number) {
        if (!total) {
            total = 0
        }

        let res = {code: code, status: this.getStatus(code), total: total, response: json}
        return res;
    }

    getStatus(code: number) {
        let status;
        if (code >= 200 && code < 300) {
            status = 'SUCCESS';
        } else {
            status = 'ERROR';
        }        
        return status;
    }
}

let resProcessor = new responseProcessor();
export default resProcessor;