namespace edb {
    
    export class Promise<R> {
        
        static allArray<R>(promises: Promise<R>[]): Promise<R[]> {
           var res = new Promise<R[]>();
            if (promises.length < 1) {
                setTimeout(() => {
                    res._invokeThen([]);
                }, 0);
            }
            
            var count = promises.length;
            try {
                var resArr: R[] = [];
                for (let i = 0; i < count; i++) {
                    resArr.push(null);
                }
                var successCount = 0;
                var errorOccured = false;
                for (let i = 0; i < count; i++) {
                    var f = function(index: number) {
                        let p = promises[index];
                        p.then((r: R) => {
                            if (errorOccured) {
                                return;
                            }
                            resArr[index] = r;
                            successCount++;
                            if (successCount == count) {
                                res._invokeThen(resArr);
                            }
                        });
                        p.error((e) => {
                            if (errorOccured) {
                                return;
                            }
                            errorOccured = true;
                            res._invokeError(e);
                        });
                    };
                    f(i);
                }
            } catch (ex) {
                errorOccured = true;
                setTimeout(() => {
                    res._invokeError(ex);
                }, 0);
            }
            return res;
        }
        
        static all<R>(...promises: Promise<R>[]): Promise<R[]> {
            return Promise.allArray(promises);
        }
        
        private _thenFunc: {(result: R): void} = null;
        private _errorFunc: {(error: any): void} = null;
        
        constructor() {
           
        }
        
        then(func: {(result: R): void}): Promise<R> {
            this._thenFunc = func;
            return this;
        }
        
        error(func: {(error: any): void}): Promise<R> {
            this._errorFunc = func;
            return this;
        }
        
        _invokeThen(result: R) {
            if (this._thenFunc != null) {
                this._thenFunc(result);
            }
        }
        
        _invokeError(error: any) {
            if (this._errorFunc != null) {
                this._errorFunc(error);
            }
        }
        
    }
    
    export function open(name: string, version: number, onUpdateNeeded: {(db: IEntityDb): void}): Promise<IEntityDb> {
        var res = new Promise<IEntityDb>();
        var req = indexedDB.open(name, version);
        var edb: IEntityDb = null;
        req.onupgradeneeded = (e: any) => {
            if (onUpdateNeeded == null) {
                return;
            }
            let db: IDBDatabase = e.target.result;
            
            if (!db.objectStoreNames.contains("Entities")) {
                let os = db.createObjectStore("Entities", {keyPath: "id", autoIncrement: true});
                os.createIndex("kind", "kind", {unique: false});
            }
            
            if (!db.objectStoreNames.contains("BooleanAttributes")) {
                let os = db.createObjectStore("BooleanAttributes", {keyPath: "id", autoIncrement: true});
                os.createIndex("entityId", "entityId", {unique: false});
                os.createIndex("kind", "kind", {unique: false});
                os.createIndex("name", "name", {unique: false});
                os.createIndex("value", "value", {unique: false});
            }
            
            if (!db.objectStoreNames.contains("NumberAttributes")) {
                let os = db.createObjectStore("NumberAttributes", {keyPath: "id", autoIncrement: true});
                os.createIndex("entityId", "entityId", {unique: false});
                os.createIndex("kind", "kind", {unique: false});
                os.createIndex("name", "name", {unique: false});
                os.createIndex("value", "value", {unique: false});
            }
            
            if (!db.objectStoreNames.contains("StringAttributes")) {
                let os = db.createObjectStore("StringAttributes", {keyPath: "id", autoIncrement: true});
                os.createIndex("entityId", "entityId", {unique: false});
                os.createIndex("kind", "kind", {unique: false});
                os.createIndex("name", "name", {unique: false});
                os.createIndex("value", "value", {unique: false});
            }
            
            edb = new EntityDb(db);
            onUpdateNeeded(edb);
        };
        req.onsuccess = (e: any) => {
            let resDb = edb;
            if (resDb == null) {
                resDb = new EntityDb(<IDBDatabase>e.target.result);
            }
            res._invokeThen(resDb);
        };
        req.onerror = (e: any) => {
            res._invokeError(e);
        };
        return res;
    }
    
    export function deleteDatabase(name: string): Promise<any> {
        var res = new Promise<any>();
        var req = indexedDB.deleteDatabase(name);
        req.onsuccess = (e) => {
            res._invokeThen(e);
        }
        req.onerror = (e) => {
            res._invokeError(e);
        }
        return res;
    }
    
    export function isSupported() {
        return indexedDB != null;
    }
    
    export interface IEntityDb {
        
    }
    
    class EntityDb implements IEntityDb {
        
        constructor(private _db: IDBDatabase) {
            
        }
        
        get<T extends AEntity>(id: number): Promise<T> {
            var transaction = this._db.transaction(["Entities"], "readonly");
            return this.getInner(id, transaction);
        }
        
        private getInner<T extends AEntity>(id: number, transaction: IDBTransaction = null): Promise<T> {
            if (transaction == null) {
                transaction = this._db.transaction(["Entities"], "readonly");
            }
            var store = transaction.objectStore("entities");
            var req = store.get(id);
            var res = new Promise<T>();
            req.onsuccess = (e: any) => {
                var result: Entity = e.target.result;
                var resolved: T = null;
                if (result != null) {
                    resolved = <T> this.resolve(result);
                }
                res._invokeThen(resolved);
            }
            req.onerror = (e) => {
                res._invokeError(e);
            }
            return res;
        }
        
        getAll<T extends AEntity>(...ids: number[]): Promise<T[]> {
            return this.getArray(ids);
        }
        
        getArray<T extends AEntity>(ids: number[]): Promise<T[]> {
            var transaction = this._db.transaction(["Entities"], "readonly");
            var promises: Promise<T>[] = [];
            for (var i = 0; i < ids.length; i++) {
                for (var i = 0; i < ids.length; i++) {
                    promises.push(this.getInner(ids[i], transaction));
                }
            }
            
            return Promise.allArray(promises);
        }
        
        
        put(entity: AEntity): Promise<number> {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            return this.putInner(entity, transaction);
        }
        
        private putInner(entity: AEntity, transaction: IDBTransaction = null): Promise<number> {
            if (transaction == null) {
                transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            }
            
            var res = new Promise<number>();
            
            var promises: Promise<any>[] = [];
            if (entity.id != null) {
                promises.push(this.removeAttributes(entity.id, transaction));
            }
            promises.push(this.putAttributes(entity));
            promises.push(this.putEntity(entity, transaction));
            
            Promise.allArray(promises).then((r: any[]) => {
                res._invokeThen(r[2]);
            }).error((e) => {
                res._invokeError(e);
            });
            
            return res;
        }
        
        private putEntity(entity: AEntity, transaction: IDBTransaction): Promise<number> {
            var res = new Promise<number>();
            
            var entityValue: string = JSON.stringify(entity);
            var e = new Entity(entity.id, entity.kind, entityValue);
            var store = transaction.objectStore("Entities");
            var req: IDBRequest = null;
            if (entity.id == null) {
                req = store.add(e);
                req.onsuccess = (r: any) => {
                    let id: number = r.target.result;
                    (<any>entity)._id = id;
                    res._invokeThen(entity.id);
                };
                req.onerror = (err) => {
                    res._invokeError(err);
                };
            } else {
                req = store.put(e);
                req.onsuccess = (r: any) => {
                    res._invokeThen(entity.id);
                };
                req.onerror = (err) => {
                    res._invokeError(err);
                };
            }
            
            return res;
        }
        
        private putAttributes(entity: AEntity): Promise<any[]> {
            var promises: Promise<any>[] = [];
            if (entity == null) {
                return Promise.allArray(promises);
            }
            
            var idxs: string[] = (<any>entity)._indexes;
            if (idxs == null || idxs.length < 1) {
                return  Promise.allArray(promises);
            }
            
            for (var i = 0; i < idxs.length; i++) {
                let idxName = idxs[i];
                let idxValue = (<any>entity)[idxName];
                
            }
        }
        
        private putAttribute(entityId: number, entityKind: string, name: string, value: any, tx: IDBTransaction): Promise<any> {
            if (value == null) {
                return Promise.all();
            }
            
            var promises: Promise<any>[] = [];
            
            if ((typeof value) == "number") {
                let store = tx.objectStore("NumberAttributes");
                let attr: Attribute = new Attribute(null, entityId, entityKind, name, value);
                let req = store.add(attr);
                var promise = new Promise<any>();
                req.onsuccess = (r) => {
                    promise._invokeThen(r);
                }
                req.onerror = (e) => {
                    promise._invokeError(e);
                }
                promises.push(promise);
            } else if ((typeof value) == "string") {
                let store = tx.objectStore("StringAttributes");
                let attr: Attribute = new Attribute(null, entityId, entityKind, name, value);
                let req = store.add(attr);
                var promise = new Promise<any>();
                req.onsuccess = (r) => {
                    promise._invokeThen(r);
                }
                req.onerror = (e) => {
                    promise._invokeError(e);
                }
                promises.push(promise);
            } else if ((typeof value) == "boolean") {
                let store = tx.objectStore("BooleanAttributes");
                let attr: Attribute = new Attribute(null, entityId, entityKind, name, value);
                let req = store.add(attr);
                var promise = new Promise<any>();
                req.onsuccess = (r) => {
                    promise._invokeThen(r);
                }
                req.onerror = (e) => {
                    promise._invokeError(e);
                }
                promises.push(promise);
            } else if (Array.isArray(value)) {
                var arr: any[] = <any[]>value;
                for (let i = 0; i < arr.length; i++) {
                    promises.push(this.putAttribute(entityId, entityKind, name, arr[i], tx))
                }
            }
            
            return Promise.allArray(promises);
        }
        
        putAll(...entities: AEntity[]): Promise<number[]> {
            return this.putArray(entities);
        }
        
        putArray(entities: AEntity[]): Promise<number[]> {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            
            var promises: Promise<number>[] = [];
            for (var i = 0; i < entities.length; i++) {
                promises.push(this.putInner(entities[i], transaction));
            }
            
            return Promise.allArray(promises);
        }
        
        
        remove(id: number): Promise<any> {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            
            return this.removeInner(id, transaction);
        }
        
        private removeInner(id: number, transaction: IDBTransaction = null): Promise<any> {
            if (transaction == null) {
                transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            }
            var promises: Promise<any>[] = [];
            
            promises.push(this.removeAttributes(id, transaction));
            promises.push(this.removeEntity(id, transaction));
            
            return Promise.allArray(promises);
        }
        
        removeAll(...ids: number[]): Promise<void[]> {
            return this.removeArray(ids);
        }
        
        removeArray(ids: number[]): Promise<void[]> {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            var promises: Promise<void>[] = [];
            for (var i = 0; i < ids.length; i++) {
                for (var i = 0; i < ids.length; i++) {
                    promises.push(this.removeInner(ids[i], transaction));
                }
            }
            
            return Promise.allArray(promises);
        }
        
        private removeEntity(id: number, transaction: IDBTransaction): Promise<void> {
            var res = new Promise<void>();
            
            var store = transaction.objectStore("Entities");
            var req = store.delete(id);
            req.onsuccess = () => {
                res._invokeThen(null);
            };
            req.onerror = (err) => {
                res._invokeError(err);
            };
            return res;
        }
        
        private removeAttributes(entityId: number, transaction: IDBTransaction): Promise<void[]> {
            var res: Promise<void[]> = Promise.all(            
                this.removeAttribute(entityId, transaction.objectStore("BooleanAttributes")),
                this.removeAttribute(entityId, transaction.objectStore("NumberAttributes")),
                this.removeAttribute(entityId, transaction.objectStore("StringAttributes"))
            );
            
            return res;
        }
        
        private removeAttribute(entityId: number, store: IDBObjectStore): Promise<void> {
            var index = store.index("entityId");
            var req = index.openCursor(IDBKeyRange.only(entityId));
            
            var res = new Promise<void>();
            
            req.onsuccess = (r: any) => {
                var cursor: IDBCursor = r.target.result;
                if (cursor != null) {
                    cursor.continue();
                } else {
                    res._invokeThen(null);
                }
            };
            req.onerror = (ex) => {
                res._invokeError(ex);
            }
            
            return res;
        }
        
        private resolve<T extends AEntity>(e: Entity): T {
            if (e == null) {
                return null;
            }
            var res = JSON.parse(e.value);
            res._id = e.id;
            return res;
        }
        
        
    }
    
    class Entity {
        
        constructor(public id: number, public kind: string, public value: string) {}
        
    }
    
    class Attribute {
        
        constructor(public id: number, public entityId: number, public kind: string, public name: string, public value: any) {}
        
    }
    
    export enum ETransactionType {
        R,
        RW
    }
    
    export abstract class AEntity {
        
        constructor(private _indexes: string[], private _id: number = null) {
            
        }
        
        get id() {
            return this._id;
        }
        
        get kind() {
            return (<any>this).constructor.name;
        }
        
        private Indexed() {
            
        }
        
    }
    
}


