declare module 'http' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface IncomingMessage {
        body: any;
    }
}
