var edb;
(function (edb_1) {
    var Promise = (function () {
        function Promise() {
            this._thenFunc = null;
            this._errorFunc = null;
        }
        Promise.allArray = function (promises) {
            var res = new Promise();
            if (promises.length < 1) {
                setTimeout(function () {
                    res._invokeThen([]);
                }, 0);
            }
            var count = promises.length;
            try {
                var resArr = [];
                for (var i = 0; i < count; i++) {
                    resArr.push(null);
                }
                var successCount = 0;
                var errorOccured = false;
                for (var i = 0; i < count; i++) {
                    var f = function (index) {
                        var p = promises[index];
                        p.then(function (r) {
                            if (errorOccured) {
                                return;
                            }
                            resArr[index] = r;
                            successCount++;
                            if (successCount == count) {
                                res._invokeThen(resArr);
                            }
                        });
                        p.error(function (e) {
                            if (errorOccured) {
                                return;
                            }
                            errorOccured = true;
                            res._invokeError(e);
                        });
                    };
                    f(i);
                }
            }
            catch (ex) {
                errorOccured = true;
                setTimeout(function () {
                    res._invokeError(ex);
                }, 0);
            }
            return res;
        };
        Promise.all = function () {
            var promises = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                promises[_i - 0] = arguments[_i];
            }
            return Promise.allArray(promises);
        };
        Promise.prototype.then = function (func) {
            this._thenFunc = func;
            return this;
        };
        Promise.prototype.error = function (func) {
            this._errorFunc = func;
            return this;
        };
        Promise.prototype._invokeThen = function (result) {
            if (this._thenFunc != null) {
                this._thenFunc(result);
            }
        };
        Promise.prototype._invokeError = function (error) {
            if (this._errorFunc != null) {
                this._errorFunc(error);
            }
        };
        return Promise;
    })();
    edb_1.Promise = Promise;
    function open(name, version, onUpdateNeeded) {
        var res = new Promise();
        var req = indexedDB.open(name, version);
        var edb = null;
        req.onupgradeneeded = function (e) {
            if (onUpdateNeeded == null) {
                return;
            }
            var db = e.target.result;
            if (!db.objectStoreNames.contains("Entities")) {
                var os = db.createObjectStore("Entities", { keyPath: "id", autoIncrement: true });
                os.createIndex("kind", "kind", { unique: false });
            }
            if (!db.objectStoreNames.contains("BooleanAttributes")) {
                var os = db.createObjectStore("BooleanAttributes", { keyPath: "id", autoIncrement: true });
                os.createIndex("entityId", "entityId", { unique: false });
                os.createIndex("kind", "kind", { unique: false });
                os.createIndex("name", "name", { unique: false });
                os.createIndex("value", "value", { unique: false });
            }
            if (!db.objectStoreNames.contains("NumberAttributes")) {
                var os = db.createObjectStore("NumberAttributes", { keyPath: "id", autoIncrement: true });
                os.createIndex("entityId", "entityId", { unique: false });
                os.createIndex("kind", "kind", { unique: false });
                os.createIndex("name", "name", { unique: false });
                os.createIndex("value", "value", { unique: false });
            }
            if (!db.objectStoreNames.contains("StringAttributes")) {
                var os = db.createObjectStore("StringAttributes", { keyPath: "id", autoIncrement: true });
                os.createIndex("entityId", "entityId", { unique: false });
                os.createIndex("kind", "kind", { unique: false });
                os.createIndex("name", "name", { unique: false });
                os.createIndex("value", "value", { unique: false });
            }
            edb = new EntityDb(db);
            onUpdateNeeded(edb);
        };
        req.onsuccess = function (e) {
            var resDb = edb;
            if (resDb == null) {
                resDb = new EntityDb(e.target.result);
            }
            res._invokeThen(resDb);
        };
        req.onerror = function (e) {
            res._invokeError(e);
        };
        return res;
    }
    edb_1.open = open;
    function deleteDatabase(name) {
        var res = new Promise();
        var req = indexedDB.deleteDatabase(name);
        req.onsuccess = function (e) {
            res._invokeThen(e);
        };
        req.onerror = function (e) {
            res._invokeError(e);
        };
        return res;
    }
    edb_1.deleteDatabase = deleteDatabase;
    function isSupported() {
        return indexedDB != null;
    }
    edb_1.isSupported = isSupported;
    var EntityDb = (function () {
        function EntityDb(_db) {
            this._db = _db;
        }
        EntityDb.prototype.get = function (id) {
            var transaction = this._db.transaction(["Entities"], "readonly");
            return this.getInner(id, transaction);
        };
        EntityDb.prototype.getInner = function (id, transaction) {
            var _this = this;
            if (transaction === void 0) { transaction = null; }
            if (transaction == null) {
                transaction = this._db.transaction(["Entities"], "readonly");
            }
            var store = transaction.objectStore("entities");
            var req = store.get(id);
            var res = new Promise();
            req.onsuccess = function (e) {
                var result = e.target.result;
                var resolved = null;
                if (result != null) {
                    resolved = _this.resolve(result);
                }
                res._invokeThen(resolved);
            };
            req.onerror = function (e) {
                res._invokeError(e);
            };
            return res;
        };
        EntityDb.prototype.getAll = function () {
            var ids = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                ids[_i - 0] = arguments[_i];
            }
            return this.getArray(ids);
        };
        EntityDb.prototype.getArray = function (ids) {
            var transaction = this._db.transaction(["Entities"], "readonly");
            var promises = [];
            for (var i = 0; i < ids.length; i++) {
                for (var i = 0; i < ids.length; i++) {
                    promises.push(this.getInner(ids[i], transaction));
                }
            }
            return Promise.allArray(promises);
        };
        EntityDb.prototype.put = function (entity) {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            return this.putInner(entity, transaction);
        };
        EntityDb.prototype.putInner = function (entity, transaction) {
            if (transaction === void 0) { transaction = null; }
            if (transaction == null) {
                transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            }
            var res = new Promise();
            var promises = [];
            if (entity.id != null) {
                promises.push(this.removeAttributes(entity.id, transaction));
            }
            promises.push(this.putAttributes(entity));
            promises.push(this.putEntity(entity, transaction));
            Promise.allArray(promises).then(function (r) {
                res._invokeThen(r[2]);
            }).error(function (e) {
                res._invokeError(e);
            });
            return res;
        };
        EntityDb.prototype.putEntity = function (entity, transaction) {
            var res = new Promise();
            var entityValue = JSON.stringify(entity);
            var e = new Entity(entity.id, entity.kind, entityValue);
            var store = transaction.objectStore("Entities");
            var req = null;
            if (entity.id == null) {
                req = store.add(e);
                req.onsuccess = function (r) {
                    var id = r.target.result;
                    entity._id = id;
                    res._invokeThen(entity.id);
                };
                req.onerror = function (err) {
                    res._invokeError(err);
                };
            }
            else {
                req = store.put(e);
                req.onsuccess = function (r) {
                    res._invokeThen(entity.id);
                };
                req.onerror = function (err) {
                    res._invokeError(err);
                };
            }
            return res;
        };
        EntityDb.prototype.putAttributes = function (entity) {
            var promises = [];
            if (entity == null) {
                return Promise.allArray(promises);
            }
            var idxs = entity._indexes;
            if (idxs == null || idxs.length < 1) {
                return Promise.allArray(promises);
            }
            for (var i = 0; i < idxs.length; i++) {
                var idxName = idxs[i];
                var idxValue = entity[idxName];
            }
        };
        EntityDb.prototype.putAttribute = function (entityId, entityKind, name, value, tx) {
            if (value == null) {
                return Promise.all();
            }
            var promises = [];
            if ((typeof value) == "number") {
                var store = tx.objectStore("NumberAttributes");
                var attr = new Attribute(null, entityId, entityKind, name, value);
                var req = store.add(attr);
                var promise = new Promise();
                req.onsuccess = function (r) {
                    promise._invokeThen(r);
                };
                req.onerror = function (e) {
                    promise._invokeError(e);
                };
                promises.push(promise);
            }
            else if ((typeof value) == "string") {
                var store = tx.objectStore("StringAttributes");
                var attr = new Attribute(null, entityId, entityKind, name, value);
                var req = store.add(attr);
                var promise = new Promise();
                req.onsuccess = function (r) {
                    promise._invokeThen(r);
                };
                req.onerror = function (e) {
                    promise._invokeError(e);
                };
                promises.push(promise);
            }
            else if ((typeof value) == "boolean") {
                var store = tx.objectStore("BooleanAttributes");
                var attr = new Attribute(null, entityId, entityKind, name, value);
                var req = store.add(attr);
                var promise = new Promise();
                req.onsuccess = function (r) {
                    promise._invokeThen(r);
                };
                req.onerror = function (e) {
                    promise._invokeError(e);
                };
                promises.push(promise);
            }
            else if (Array.isArray(value)) {
                var arr = value;
                for (var i = 0; i < arr.length; i++) {
                    promises.push(this.putAttribute(entityId, entityKind, name, arr[i], tx));
                }
            }
            return Promise.allArray(promises);
        };
        EntityDb.prototype.putAll = function () {
            var entities = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                entities[_i - 0] = arguments[_i];
            }
            return this.putArray(entities);
        };
        EntityDb.prototype.putArray = function (entities) {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            var promises = [];
            for (var i = 0; i < entities.length; i++) {
                promises.push(this.putInner(entities[i], transaction));
            }
            return Promise.allArray(promises);
        };
        EntityDb.prototype.remove = function (id) {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            return this.removeInner(id, transaction);
        };
        EntityDb.prototype.removeInner = function (id, transaction) {
            if (transaction === void 0) { transaction = null; }
            if (transaction == null) {
                transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            }
            var promises = [];
            promises.push(this.removeAttributes(id, transaction));
            promises.push(this.removeEntity(id, transaction));
            return Promise.allArray(promises);
        };
        EntityDb.prototype.removeAll = function () {
            var ids = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                ids[_i - 0] = arguments[_i];
            }
            return this.removeArray(ids);
        };
        EntityDb.prototype.removeArray = function (ids) {
            var transaction = this._db.transaction(["Entities", "BooleanAttributes", "NumberAttributes", "StringAttributes"], "readwrite");
            var promises = [];
            for (var i = 0; i < ids.length; i++) {
                for (var i = 0; i < ids.length; i++) {
                    promises.push(this.removeInner(ids[i], transaction));
                }
            }
            return Promise.allArray(promises);
        };
        EntityDb.prototype.removeEntity = function (id, transaction) {
            var res = new Promise();
            var store = transaction.objectStore("Entities");
            var req = store.delete(id);
            req.onsuccess = function () {
                res._invokeThen(null);
            };
            req.onerror = function (err) {
                res._invokeError(err);
            };
            return res;
        };
        EntityDb.prototype.removeAttributes = function (entityId, transaction) {
            var res = Promise.all(this.removeAttribute(entityId, transaction.objectStore("BooleanAttributes")), this.removeAttribute(entityId, transaction.objectStore("NumberAttributes")), this.removeAttribute(entityId, transaction.objectStore("StringAttributes")));
            return res;
        };
        EntityDb.prototype.removeAttribute = function (entityId, store) {
            var index = store.index("entityId");
            var req = index.openCursor(IDBKeyRange.only(entityId));
            var res = new Promise();
            req.onsuccess = function (r) {
                var cursor = r.target.result;
                if (cursor != null) {
                    cursor.continue();
                }
                else {
                    res._invokeThen(null);
                }
            };
            req.onerror = function (ex) {
                res._invokeError(ex);
            };
            return res;
        };
        EntityDb.prototype.resolve = function (e) {
            if (e == null) {
                return null;
            }
            var res = JSON.parse(e.value);
            res._id = e.id;
            return res;
        };
        return EntityDb;
    })();
    var Entity = (function () {
        function Entity(id, kind, value) {
            this.id = id;
            this.kind = kind;
            this.value = value;
        }
        return Entity;
    })();
    var Attribute = (function () {
        function Attribute(id, entityId, kind, name, value) {
            this.id = id;
            this.entityId = entityId;
            this.kind = kind;
            this.name = name;
            this.value = value;
        }
        return Attribute;
    })();
    (function (ETransactionType) {
        ETransactionType[ETransactionType["R"] = 0] = "R";
        ETransactionType[ETransactionType["RW"] = 1] = "RW";
    })(edb_1.ETransactionType || (edb_1.ETransactionType = {}));
    var ETransactionType = edb_1.ETransactionType;
    var AEntity = (function () {
        function AEntity(_indexes, _id) {
            if (_id === void 0) { _id = null; }
            this._indexes = _indexes;
            this._id = _id;
        }
        Object.defineProperty(AEntity.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AEntity.prototype, "kind", {
            get: function () {
                return this.constructor.name;
            },
            enumerable: true,
            configurable: true
        });
        AEntity.prototype.Indexed = function () {
        };
        return AEntity;
    })();
    edb_1.AEntity = AEntity;
})(edb || (edb = {}));
//# sourceMappingURL=edb.js.map