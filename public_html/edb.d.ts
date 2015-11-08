declare namespace edb {
    class Promise<R> {
        static allArray<R>(promises: Promise<R>[]): Promise<R[]>;
        static all<R>(...promises: Promise<R>[]): Promise<R[]>;
        private _thenFunc;
        private _errorFunc;
        constructor();
        then(func: {
            (result: R): void;
        }): Promise<R>;
        error(func: {
            (error: any): void;
        }): Promise<R>;
        _invokeThen(result: R): void;
        _invokeError(error: any): void;
    }
    function open(name: string, version: number, onUpdateNeeded: {
        (db: IEntityDb): void;
    }): Promise<IEntityDb>;
    function deleteDatabase(name: string): Promise<any>;
    function isSupported(): boolean;
    interface IEntityDb {
    }
    enum ETransactionType {
        R = 0,
        RW = 1,
    }
    abstract class AEntity {
        private _indexes;
        private _id;
        constructor(_indexes: string[], _id?: number);
        id: number;
        kind: any;
        private Indexed();
    }
}
