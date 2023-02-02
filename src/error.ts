
export class InvalidToken extends Error{

    constructor(message: string) {
        // Need to pass `options` as the second parameter to install the "cause" property.
        super(message);
      }
}