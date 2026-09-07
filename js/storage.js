// ===============================
// InkBoard
// storage.js
// IndexedDB Storage System
// ===============================

(function () {
    "use strict";

    const DB_NAME = "InkBoardDB";
    const DB_VERSION = 1;
    const STORE_NAME = "battles";

    let db = null;

    // --------------------------------
    // DB初期化
    // --------------------------------

    function init() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            if (!window.indexedDB) {
                reject(new Error("このブラウザではIndexedDBが利用できません。"));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                const database = event.target.result;

                let store;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    store = database.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                } else {
                    store = event.target.transaction.objectStore(STORE_NAME);
                }

                // 検索用インデックス
                if (!store.indexNames.contains("playedTime")) {
                    store.createIndex(
                        "playedTime",
                        "playedTime",
                        { unique: false }
                    );
                }

                if (!store.indexNames.contains("result")) {
                    store.createIndex(
                        "result",
                        "result",
                        { unique: false }
                    );
                }

                if (!store.indexNames.contains("isTricolor")) {
                    store.createIndex(
                        "isTricolor",
                        "isTricolor",
                        { unique: false }
                    );
                }

                if (!store.indexNames.contains("rule")) {
                    store.createIndex(
                        "rule.name",
                        "rule.name",
                        { unique: false }
                    );
                }

                if (!store.indexNames.contains("mode")) {
                    store.createIndex(
                        "mode.mode",
                        "mode.mode",
                        { unique: false }
                    );
                }
            };

            request.onsuccess = function (event) {
                db = event.target.result;

                db.onversionchange = function () {
                    db.close();
                    db = null;
                };

                resolve(db);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("IndexedDBの初期化に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // DB取得
    // --------------------------------

    async function getDB() {
        if (db) {
            return db;
        }

        return await init();
    }

    // --------------------------------
    // 1件保存
    // --------------------------------

    async function putBattle(battle) {
        if (!battle || !battle.id) {
            throw new Error("保存するバトルデータにIDがありません。");
        }

        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);

            const request = store.put(battle);

            request.onsuccess = function () {
                resolve(battle);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトルデータの保存に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // 複数件保存
    // --------------------------------

    async function putBattles(battles) {
        if (!Array.isArray(battles)) {
            throw new Error("保存するバトルデータが配列ではありません。");
        }

        if (battles.length === 0) {
            return {
                imported: 0,
                total: await countBattles()
            };
        }

        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);

            let imported = 0;

            for (const battle of battles) {
                if (!battle || !battle.id) {
                    continue;
                }

                store.put(battle);
                imported++;
            }

            transaction.oncomplete = async function () {
                try {
                    const total = await countBattles();

                    resolve({
                        imported,
                        total
                    });
                } catch (error) {
                    reject(error);
                }
            };

            transaction.onerror = function () {
                reject(
                    transaction.error ||
                    new Error("バトルデータの一括保存に失敗しました。")
                );
            };

            transaction.onabort = function () {
                reject(
                    transaction.error ||
                    new Error("バトルデータの保存が中断されました。")
                );
            };
        });
    }

    // --------------------------------
    // インポート用
    // --------------------------------

    async function importData(data) {
        let battles = data;

        if (
            data &&
            !Array.isArray(data) &&
            Array.isArray(data.battles)
        ) {
            battles = data.battles;
        }

        if (!Array.isArray(battles)) {
            throw new Error(
                "インポートするバトルデータが見つかりません。"
            );
        }

        return await putBattles(battles);
    }

    // --------------------------------
    // 1件取得
    // --------------------------------

    async function getBattle(id) {
        if (!id) {
            return null;
        }

        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readonly"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = function () {
                resolve(request.result || null);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトルデータの取得に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // 全件取得
    // --------------------------------

    async function getBattles() {
        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readonly"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = function () {
                const battles = request.result || [];

                battles.sort((a, b) => {
                    const timeA = parseDateValue(a.playedTime);
                    const timeB = parseDateValue(b.playedTime);

                    return timeB - timeA;
                });

                resolve(battles);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトル一覧の取得に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // 件数
    // --------------------------------

    async function countBattles() {
        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readonly"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = function () {
                resolve(request.result || 0);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトル件数の取得に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // バトル削除
    // --------------------------------

    async function deleteBattle(id) {
        if (!id) {
            return false;
        }

        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトルデータの削除に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // 全データ削除
    // --------------------------------

    async function clearBattles() {
        const database = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("バトルデータの削除に失敗しました。")
                );
            };
        });
    }

    // --------------------------------
    // 全DB削除
    // --------------------------------

    async function deleteDatabase() {
        if (db) {
            db.close();
            db = null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function () {
                reject(
                    request.error ||
                    new Error("データベースの削除に失敗しました。")
                );
            };

            request.onblocked = function () {
                reject(
                    new Error(
                        "データベースが別の処理で使用中です。"
                    )
                );
            };
        });
    }

    // --------------------------------
    // JSONバックアップ
    // --------------------------------

    async function exportData() {
        const battles = await getBattles();

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            battles
        };
    }

    // --------------------------------
    // JSONバックアップ文字列
    // --------------------------------

    async function exportJSON() {
        const data = await exportData();

        return JSON.stringify(
            data,
            null,
            2
        );
    }

    // --------------------------------
    // JSONバックアップを保存
    // --------------------------------

    async function downloadBackup() {
        const json = await exportJSON();

        const blob = new Blob(
            [json],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const date = new Date();

        const fileName =
            "InkBoard_backup_" +
            date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, "0") +
            String(date.getDate()).padStart(2, "0") +
            "_" +
            String(date.getHours()).padStart(2, "0") +
            String(date.getMinutes()).padStart(2, "0") +
            String(date.getSeconds()).padStart(2, "0") +
            ".json";

        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        return fileName;
    }

    // --------------------------------
    // 日付変換
    // --------------------------------

    function parseDateValue(value) {
        if (value === null || value === undefined) {
            return 0;
        }

        if (typeof value === "number") {
            return value;
        }

        const numeric = Number(value);

        if (!Number.isNaN(numeric)) {
            return numeric;
        }

        const parsed = Date.parse(value);

        if (!Number.isNaN(parsed)) {
            return parsed;
        }

        return 0;
    }

    // --------------------------------
    // API
    // --------------------------------

    const api = {
        init,
        getDB,

        putBattle,
        putBattles,

        importData,

        getBattle,
        getBattles,
        countBattles,

        deleteBattle,
        clearBattles,
        deleteDatabase,

        exportData,
        exportJSON,
        downloadBackup
    };

    // app.js / importer.js から使用
    window.Storage = api;

    // 念のため別名でも公開
    window.InkBoardStorage = api;

})();
