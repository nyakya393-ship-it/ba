/* =========================================================
   InkBoard
   js/app.js
   Application Controller
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       App State
       ===================================================== */

    const state = {
        currentPage: "battle",
        previousPage: "battle",
        initialized: false
    };

    /* =====================================================
       DOM
       ===================================================== */

    const elements = {
        header: document.getElementById("appHeader"),
        headerTitle: document.getElementById("headerTitle"),
        headerBackButton: document.getElementById("headerBackButton"),
        headerSettingsButton: document.getElementById(
            "headerSettingsButton"
        ),

        main: document.getElementById("mainContent"),

        battlePage: document.getElementById("battlePage"),
        battleDetailPage: document.getElementById(
            "battleDetailPage"
        ),
        salmonPage: document.getElementById("salmonPage"),
        statisticsPage: document.getElementById(
            "statisticsPage"
        ),
        settingsPage: document.getElementById("settingsPage"),

        bottomNav: document.getElementById("bottomNav"),

        toast: document.getElementById("toast"),
        loading: document.getElementById("loading")
    };

    /* =====================================================
       Page Definitions
       ===================================================== */

    const pages = {
        battle: {
            element: elements.battlePage,
            title: "バトル"
        },

        detail: {
            element: elements.battleDetailPage,
            title: "バトル詳細"
        },

        salmon: {
            element: elements.salmonPage,
            title: "サーモンラン"
        },

        statistics: {
            element: elements.statisticsPage,
            title: "分析"
        },

        settings: {
            element: elements.settingsPage,
            title: "設定"
        }
    };

    /* =====================================================
       Helpers
       ===================================================== */

    function isElementVisible(element) {
        return Boolean(
            element &&
            !element.hidden &&
            element.style.display !== "none"
        );
    }

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }

        element.hidden = hidden;
    }

    function updateHeader() {
        const page = pages[state.currentPage];

        if (!page) {
            return;
        }

        if (elements.headerTitle) {
            elements.headerTitle.textContent = page.title;
        }

        const showBack =
            state.currentPage === "detail" ||
            state.currentPage === "settings";

        setHidden(elements.headerBackButton, !showBack);

        setHidden(
            elements.headerSettingsButton,
            state.currentPage !== "battle" &&
            state.currentPage !== "salmon" &&
            state.currentPage !== "statistics"
        );
    }

    function updateBottomNavigation() {
        if (!elements.bottomNav) {
            return;
        }

        const buttons =
            elements.bottomNav.querySelectorAll(
                "[data-action]"
            );

        buttons.forEach((button) => {
            const action = button.dataset.action;

            const active =
                (action === "battle" &&
                    state.currentPage === "battle") ||
                (action === "salmon" &&
                    state.currentPage === "salmon") ||
                (action === "statistics" &&
                    state.currentPage === "statistics");

            button.classList.toggle("active", active);

            button.setAttribute(
                "aria-current",
                active ? "page" : "false"
            );
        });
    }

    /* =====================================================
       Page Navigation
       ===================================================== */

    function showPage(pageName, options = {}) {
        const {
            pushHistory = true
        } = options;

        if (!pages[pageName]) {
            return false;
        }

        if (
            state.currentPage === pageName &&
            pageName !== "detail"
        ) {
            updateHeader();
            updateBottomNavigation();
            return true;
        }

        if (pushHistory) {
            state.previousPage = state.currentPage;
        }

        Object.keys(pages).forEach((name) => {
            const page = pages[name];

            if (!page.element) {
                return;
            }

            setHidden(
                page.element,
                name !== pageName
            );
        });

        state.currentPage = pageName;

        updateHeader();
        updateBottomNavigation();

        window.scrollTo({
            top: 0,
            behavior: "auto"
        });

        return true;
    }

    function goBack() {
        if (state.currentPage === "detail") {
            showPage(
                state.previousPage === "detail"
                    ? "battle"
                    : state.previousPage,
                {
                    pushHistory: false
                }
            );

            return;
        }

        if (state.currentPage === "settings") {
            showPage(
                state.previousPage === "settings"
                    ? "battle"
                    : state.previousPage,
                {
                    pushHistory: false
                }
            );

            return;
        }

        showPage("battle", {
            pushHistory: false
        });
    }

    /* =====================================================
       Detail Navigation
       ===================================================== */

    function showBattleDetail(battleId) {
        if (!battleId) {
            return;
        }

        state.previousPage = state.currentPage;

        /*
         * battle.js が存在する場合は、
         * その公開APIに詳細表示を任せる。
         */
        if (
            window.Battle &&
            typeof window.Battle.showDetail === "function"
        ) {
            window.Battle.showDetail(battleId);
        }

        showPage("detail", {
            pushHistory: false
        });
    }

    /* =====================================================
       Generic Actions
       ===================================================== */

    function handleAction(action, element) {
        switch (action) {
            case "battle":
                showPage("battle");
                break;

            case "salmon":
                showPage("salmon");
                break;

            case "statistics":
                showPage("statistics");
                break;

            case "settings":
                state.previousPage = state.currentPage;
                showPage("settings", {
                    pushHistory: false
                });
                break;

            case "back":
                goBack();
                break;

            case "import":
                /*
                 * インポート処理は importer.js が担当。
                 *
                 * app.js では処理しない。
                 * これにより import ボタンを複数配置しても
                 * イベントが二重実行されない。
                 */
                break;

            case "export":
                if (
                    window.Storage &&
                    typeof window.Storage.exportData ===
                        "function"
                ) {
                    window.Storage.exportData();
                }
                break;

            case "delete-data":
                if (
                    window.Storage &&
                    typeof window.Storage.deleteAll ===
                        "function"
                ) {
                    window.Storage.deleteAll();
                }
                break;

            default:
                break;
        }

        if (element) {
            element.blur();
        }
    }

    /* =====================================================
       Click Handling
       ===================================================== */

    function handleClick(event) {
        const target =
            event.target.closest("[data-action]");

        if (!target) {
            return;
        }

        const action = target.dataset.action;

        if (!action) {
            return;
        }

        handleAction(action, target);
    }

    function handleBattleRowClick(event) {
        const row =
            event.target.closest("[data-battle-id]");

        if (!row) {
            return;
        }

        /*
         * プレイヤーカードなど、
         * バトル行の中にある別操作は除外する。
         */
        if (
            event.target.closest(
                "[data-player-id], [data-action]"
            )
        ) {
            return;
        }

        const battleId =
            row.dataset.battleId;

        if (!battleId) {
            return;
        }

        showBattleDetail(battleId);
    }

    /* =====================================================
       Keyboard
       ===================================================== */

    function handleKeyDown(event) {
        if (event.key !== "Escape") {
            return;
        }

        /*
         * モーダルが開いている場合は
         * ui.js 側に閉じてもらう。
         */
        if (
            window.UI &&
            typeof window.UI.closeModal === "function"
        ) {
            const closed =
                window.UI.closeModal();

            if (closed) {
                return;
            }
        }

        if (
            state.currentPage === "detail" ||
            state.currentPage === "settings"
        ) {
            goBack();
        }
    }

    /* =====================================================
       Browser History
       ===================================================== */

    function setupHistory() {
        window.addEventListener(
            "popstate",
            () => {
                if (
                    state.currentPage === "detail" ||
                    state.currentPage === "settings"
                ) {
                    goBack();
                }
            }
        );
    }

    /* =====================================================
       Module Initialization
       ===================================================== */

    async function initializeModules() {
        /*
         * 各ファイルは存在する場合のみ初期化。
         * まだ未作成のファイルがあっても
         * app.js 自体でエラーにならない構造。
         */

        if (
            window.Storage &&
            typeof window.Storage.init === "function"
        ) {
            await window.Storage.init();
        }

        if (
            window.Parser &&
            typeof window.Parser.init === "function"
        ) {
            await window.Parser.init();
        }

        if (
            window.Importer &&
            typeof window.Importer.init ===
                "function"
        ) {
            await window.Importer.init();
        }

        if (
            window.Battle &&
            typeof window.Battle.init === "function"
        ) {
            await window.Battle.init();
        }

        if (
            window.Analyzer &&
            typeof window.Analyzer.init ===
                "function"
        ) {
            await window.Analyzer.init();
        }

        if (
            window.UI &&
            typeof window.UI.init === "function"
        ) {
            await window.UI.init();
        }
    }

    /* =====================================================
       Event Setup
       ===================================================== */

    function setupEvents() {
        document.addEventListener(
            "click",
            handleClick
        );

        document.addEventListener(
            "click",
            handleBattleRowClick
        );

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        setupHistory();
    }

    /* =====================================================
       Initial Screen
       ===================================================== */

    function initializeScreen() {
        Object.keys(pages).forEach((name) => {
            const page = pages[name];

            if (!page.element) {
                return;
            }

            setHidden(
                page.element,
                name !== "battle"
            );
        });

        state.currentPage = "battle";
        state.previousPage = "battle";

        updateHeader();
        updateBottomNavigation();
    }

    /* =====================================================
       Public API
       ===================================================== */

    window.InkBoard = {
        state,

        showPage,
        showBattleDetail,
        goBack,

        getCurrentPage() {
            return state.currentPage;
        },

        toast(message) {
            if (
                window.UI &&
                typeof window.UI.toast === "function"
            ) {
                window.UI.toast(message);
            }
        },

        loading(show, message) {
            if (
                window.UI &&
                typeof window.UI.setLoading ===
                    "function"
            ) {
                window.UI.setLoading(
                    show,
                    message
                );
            }
        }
    };

    /* =====================================================
       Start
       ===================================================== */

    async function start() {
        if (state.initialized) {
            return;
        }

        state.initialized = true;

        initializeScreen();
        setupEvents();

        try {
            await initializeModules();
        } catch (error) {
            console.error(
                "InkBoard initialization error:",
                error
            );

            /*
             * 起動自体は継続する。
             * モジュール単位のエラーで
             * アプリ全体を停止させない。
             */
            if (
                window.UI &&
                typeof window.UI.toast ===
                    "function"
            ) {
                window.UI.toast(
                    "アプリの一部を初期化できませんでした"
                );
            }
        }

        /*
         * 初期データ表示。
         */
        if (
            window.Battle &&
            typeof window.Battle.refresh ===
                "function"
        ) {
            try {
                await window.Battle.refresh();
            } catch (error) {
                console.error(
                    "Battle refresh error:",
                    error
                );
            }
        }
    }

    /* =====================================================
       DOM Ready
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );
    } else {
        start();
    }
})();
