/* =========================================================
   InkBoard
   js/importer.js
   Horagai Bay JSON / ZIP Importer
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       DOM
       ===================================================== */

    let fileInput = null;

    /* =====================================================
       State
       ===================================================== */

    const state = {
        initialized: false,
        importing: false
    };

    /* =====================================================
       Constants
       ===================================================== */

    const ALLOWED_EXTENSIONS = [
        ".json",
        ".zip"
    ];

    const ALLOWED_TYPES = [
        "application/json",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream"
    ];

    /* =====================================================
       Utility
       ===================================================== */

    function getFileExtension(name) {
        if (!name) {
            return "";
        }

        const lowerName = name.toLowerCase();

        const index = lowerName.lastIndexOf(".");

        if (index === -1) {
            return "";
        }

        return lowerName.slice(index);
    }

    function isSupportedFile(file) {
        if (!file) {
            return false;
        }

        const extension =
            getFileExtension(file.name);

        if (
            ALLOWED_EXTENSIONS.includes(
                extension
            )
        ) {
            return true;
        }

        if (
            file.type &&
            ALLOWED_TYPES.includes(file.type)
        ) {
            return true;
        }

        return false;
    }

    function showMessage(message) {
        if (
            window.InkBoard &&
            typeof window.InkBoard.toast ===
                "function"
        ) {
            window.InkBoard.toast(message);
            return;
        }

        console.log(message);
    }

    function setLoading(show, message) {
        if (
            window.InkBoard &&
            typeof window.InkBoard.loading ===
                "function"
        ) {
            window.InkBoard.loading(
                show,
                message
            );
        }
    }

    /* =====================================================
       Open File Picker
       ===================================================== */

    function openFilePicker() {
        if (!fileInput) {
            fileInput =
                document.getElementById(
                    "fileInput"
                );
        }

        if (!fileInput) {
            showMessage(
                "ファイル選択欄が見つかりません"
            );
            return false;
        }

        if (state.importing) {
            return false;
        }

        /*
         * 同じファイルをもう一度選択しても
         * changeイベントが発生するようにする。
         */
        fileInput.value = "";

        fileInput.click();

        return true;
    }

    /* =====================================================
       Read File
       ===================================================== */

    async function readTextFile(file) {
        if (
            typeof file.text === "function"
        ) {
            return await file.text();
        }

        return await new Promise(
            (resolve, reject) => {
                const reader =
                    new FileReader();

                reader.onload = () => {
                    resolve(
                        reader.result
                    );
                };

                reader.onerror = () => {
                    reject(
                        reader.error ||
                        new Error(
                            "ファイルの読み込みに失敗しました"
                        )
                    );
                };

                reader.readAsText(
                    file,
                    "UTF-8"
                );
            }
        );
    }

    async function readArrayBuffer(file) {
        if (
            typeof file.arrayBuffer ===
            "function"
        ) {
            return await file.arrayBuffer();
        }

        return await new Promise(
            (resolve, reject) => {
                const reader =
                    new FileReader();

                reader.onload = () => {
                    resolve(
                        reader.result
                    );
                };

                reader.onerror = () => {
                    reject(
                        reader.error ||
                        new Error(
                            "ファイルの読み込みに失敗しました"
                        )
                    );
                };

                reader.readAsArrayBuffer(
                    file
                );
            }
        );
    }

    /* =====================================================
       JSON Import
       ===================================================== */

    async function importJSON(file) {
        const text =
            await readTextFile(file);

        if (
            !text ||
            !text.trim()
        ) {
            throw new Error(
                "JSONファイルが空です"
            );
        }

        let json;

        try {
            json = JSON.parse(text);
        } catch (error) {
            throw new Error(
                "JSONの解析に失敗しました"
            );
        }

        if (!json || typeof json !== "object") {
            throw new Error(
                "正しいJSONデータではありません"
            );
        }

        return await parseImportedData(
            json,
            file.name
        );
    }

    /* =====================================================
       ZIP Import
       ===================================================== */

    async function importZIP(file) {
        const buffer =
            await readArrayBuffer(file);

        /*
         * parser.js側でJSZipを使用する。
         * Parser.parseZIPがあればそこへ渡す。
         */

        if (
            window.Parser &&
            typeof window.Parser.parseZIP ===
                "function"
        ) {
            return await window.Parser.parseZIP(
                buffer
            );
        }

        /*
         * Parserがまだ読み込まれていない場合。
         * 通常の起動では発生しないが、
         * エラー内容を明確にする。
         */
        throw new Error(
            "ZIP解析機能を初期化できません"
        );
    }

    /* =====================================================
       Parser Bridge
       ===================================================== */

    async function parseImportedData(
        data,
        fileName
    ) {
        if (
            !window.Parser
        ) {
            throw new Error(
                "データ解析機能を初期化できません"
            );
        }

        /*
         * Parser.parseImportを優先。
         *
         * parser.js側で
         * Horagai Bayの形式を統一Battle形式へ
         * 変換する。
         */
        if (
            typeof window.Parser.parseImport ===
                "function"
        ) {
            return await window.Parser.parseImport(
                data,
                {
                    fileName
                }
            );
        }

        /*
         * parseJSONしか存在しない場合の
         * フォールバック。
         */
        if (
            typeof window.Parser.parseJSON ===
                "function"
        ) {
            return await window.Parser.parseJSON(
                data
            );
        }

        throw new Error(
            "JSON解析機能が見つかりません"
        );
    }

    /* =====================================================
       Save Parsed Battles
       ===================================================== */

    async function saveBattles(result) {
        if (!result) {
            throw new Error(
                "解析結果がありません"
            );
        }

        /*
         * parser.jsは、
         *
         * {
         *   battles: [...],
         *   ...
         * }
         *
         * または配列を返せるようにする。
         */
        let battles = [];

        if (
            Array.isArray(result)
        ) {
            battles = result;
        } else if (
            Array.isArray(result.battles)
        ) {
            battles = result.battles;
        }

        if (battles.length === 0) {
            throw new Error(
                "バトルデータが見つかりませんでした"
            );
        }

        if (
            !window.Storage
        ) {
            throw new Error(
                "保存機能を初期化できません"
            );
        }

        /*
         * importDataがあれば、
         * 重複チェックをStorage側に任せる。
         */
        if (
            typeof window.Storage.importData ===
                "function"
        ) {
            return await window.Storage.importData(
                battles
            );
        }

        /*
         * putBattlesしかない場合の
         * フォールバック。
         */
        if (
            typeof window.Storage.putBattles ===
                "function"
        ) {
            await window.Storage.putBattles(
                battles
            );

            return {
                imported: battles.length,
                total: battles.length
            };
        }

        throw new Error(
            "データ保存機能が見つかりません"
        );
    }

    /* =====================================================
       Refresh Battle Screen
       ===================================================== */

    async function refreshBattleScreen() {
        if (
            window.Battle &&
            typeof window.Battle.refresh ===
                "function"
        ) {
            await window.Battle.refresh();
        }

        if (
            window.UI &&
            typeof window.UI.refresh ===
                "function"
        ) {
            await window.UI.refresh();
        }
    }

    /* =====================================================
       Import Result Message
       ===================================================== */

    function getImportedCount(result) {
        if (!result) {
            return 0;
        }

        if (
            typeof result.imported ===
            "number"
        ) {
            return result.imported;
        }

        if (
            typeof result.added ===
            "number"
        ) {
            return result.added;
        }

        if (
            typeof result.count ===
            "number"
        ) {
            return result.count;
        }

        return 0;
    }

    function getDuplicateCount(result) {
        if (!result) {
            return 0;
        }

        if (
            typeof result.duplicates ===
            "number"
        ) {
            return result.duplicates;
        }

        if (
            typeof result.skipped ===
            "number"
        ) {
            return result.skipped;
        }

        return 0;
    }

    function showImportResult(result) {
        const imported =
            getImportedCount(result);

        const duplicates =
            getDuplicateCount(result);

        if (
            imported === 0 &&
            duplicates > 0
        ) {
            showMessage(
                `新しいバトルはありません（重複 ${duplicates}件）`
            );
            return;
        }

        if (
            imported > 0 &&
            duplicates > 0
        ) {
            showMessage(
                `${imported}件を追加しました（重複 ${duplicates}件）`
            );
            return;
        }

        showMessage(
            `${imported}件のバトルを読み込みました`
        );
    }

    /* =====================================================
       Main Import
       ===================================================== */

    async function importFile(file) {
        if (state.importing) {
            return;
        }

        if (!file) {
            return;
        }

        if (!isSupportedFile(file)) {
            showMessage(
                "JSONまたはZIPファイルを選択してください"
            );
            return;
        }

        state.importing = true;

        try {
            setLoading(
                true,
                "データを読み込んでいます…"
            );

            const extension =
                getFileExtension(
                    file.name
                );

            let parsedResult;

            if (
                extension === ".zip"
            ) {
                parsedResult =
                    await importZIP(file);
            } else {
                parsedResult =
                    await importJSON(file);
            }

            /*
             * ZIPについてParser.parseZIPが
             * すでにBattle配列を返している場合、
             * そのまま保存する。
             *
             * JSONの場合も同じ。
             */
            const saveResult =
                await saveBattles(
                    parsedResult
                );

            await refreshBattleScreen();

            showImportResult(
                saveResult
            );

            /*
             * インポート完了後はバトル画面へ。
             */
            if (
                window.InkBoard &&
                typeof window.InkBoard.showPage ===
                    "function"
            ) {
                window.InkBoard.showPage(
                    "battle"
                );
            }
        } catch (error) {
            console.error(
                "InkBoard import error:",
                error
            );

            const message =
                error &&
                error.message
                    ? error.message
                    : "データの読み込みに失敗しました";

            showMessage(
                message
            );
        } finally {
            state.importing = false;

            setLoading(
                false
            );

            if (fileInput) {
                fileInput.value = "";
            }
        }
    }

    /* =====================================================
       File Input Event
       ===================================================== */

    function handleFileChange(event) {
        const input =
            event.currentTarget;

        if (!input) {
            return;
        }

        const files =
            input.files;

        if (
            !files ||
            files.length === 0
        ) {
            return;
        }

        /*
         * 今回は1回につき1ファイル。
         *
         * ZIP内には複数JSONが入っていても
         * ZIP自体をParserへ渡す。
         */
        const file = files[0];

        importFile(file);
    }

    /* =====================================================
       Import Button Event
       ===================================================== */

    function handleImportButton(event) {
        const button =
            event.target.closest(
                '[data-action="import"]'
            );

        if (!button) {
            return;
        }

        /*
         * disabledボタン等では起動しない。
         */
        if (
            button.disabled ||
            button.getAttribute(
                "aria-disabled"
            ) === "true"
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        openFilePicker();
    }

    /* =====================================================
       Initialization
       ===================================================== */

    function init() {
        if (state.initialized) {
            return;
        }

        fileInput =
            document.getElementById(
                "fileInput"
            );

        if (!fileInput) {
            console.error(
                "InkBoard: #fileInput が見つかりません"
            );

            return;
        }

        /*
         * ファイル選択。
         */
        fileInput.addEventListener(
            "change",
            handleFileChange
        );

        /*
         * importボタンはImporterが
         * 一括管理する。
         *
         * documentに1個だけ登録することで、
         * 空画面のボタン・設定画面のボタンなど
         * どこからでも同じ処理を使える。
         */
        document.addEventListener(
            "click",
            handleImportButton
        );

        state.initialized = true;
    }

    /* =====================================================
       Public API
       ===================================================== */

    window.Importer = {
        init,

        openFilePicker,

        importFile,

        isImporting() {
            return state.importing;
        }
    };
})();
