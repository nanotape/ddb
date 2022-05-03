class BaseError extends Error {
    constructor(m)
    {
        super(m);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
};

class ERR_INVALID_EVENT extends BaseError {
    constructor(e){ super(`Event type '${e}' does not exist`); }
};

class ERR_INVALID_INTENT extends BaseError {
    constructor(i){ super(`Intent '${i}' does not exist`); }
};

class ERR_INSUFFICIENT_INTENTS extends BaseError {
    constructor(e, i){ super(`Event '${e}' is not accessible under the current client intents ${i.toString()}`); }
};

class ERR_INVALID_INTENT_ARRAY extends BaseError {
    constructor(i){ super(`'${i}' is not an array of valid client intents`); }
};

class ERR_INVALID_HELLO_EXCHANGE extends BaseError {
    constructor(){ super("Client recieved Hello (Opcode 10) after making handshake"); }
};

class ERR_SESSION_INVALIDATED extends BaseError {
    constructor(){ super("Client session invalidated by Discord"); }
};

class ERR_CLIENT_NOT_STARTED extends BaseError {
    constructor(){ super("Action impossible until client is started"); }
};

class ERR_CLIENT_IDENTIFICATION_FAILED extends BaseError {
    constructor(){ super(); }
};

class ERR_CLIENT_MISSING_ACCESS extends BaseError {
    constructor(url){ super(`Client denied access to endpoint: ${url}`); }
};

class ERR_SERVER_INTERNAL_500 extends BaseError {
    constructor(url){ super(`Server returned 500 after request to: ${url}`); }
};

module.exports = {
    ERR_INVALID_EVENT,
    ERR_INVALID_INTENT,
    ERR_INSUFFICIENT_INTENTS,
    ERR_INVALID_INTENT_ARRAY,
    ERR_INVALID_HELLO_EXCHANGE,
    ERR_SESSION_INVALIDATED,
    ERR_CLIENT_NOT_STARTED,
    ERR_CLIENT_IDENTIFICATION_FAILED,
    ERR_CLIENT_MISSING_ACCESS,
    ERR_SERVER_INTERNAL_500
};
