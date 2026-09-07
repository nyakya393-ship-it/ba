// ===============================
// InkBoard
// ui.js
// Common UI Controller
// ===============================

(function () {
    "use strict";

    let initialized = false;

    const PAGE_TITLES = {
        battle: "バトル",
        detail: "バトル詳細",
        salmon: "サーモンラン",
        statistics: "分析",
        settings: "設定"
    };

    // --------------------------------
    // 初期化
    // --------------------------------

    function init() {
        if (initialized) {
            return true;
        }

        bindUI();

        initialized = true;

        return true;
    }

    // --------------------------------
    // UIイベント
    // --------------------------------

    function bindUI() {
        // 戻るボタン
        const backButton =
            document.getElementById(
                "headerBackButton"
            );

        if (backButton) {
            backButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    if (
                        window.InkBoard &&
                        typeof InkBoard.goBack ===
                            "function"
                    ) {
                        InkBoard.goBack();
                    }
                }
            );
        }

        // 設定ボタン
        const settingsButton =
            document.getElementById(
                "headerSettingsButton"
            );

        if (settingsButton) {
            settingsButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    if (
                        window.InkBoard &&
                        typeof InkBoard.showPage ===
                            "function"
                    ) {
                        InkBoard.showPage(
                            "settings"
                        );
                    }
                }
            );
        }

        // ESCキー
        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape"
                ) {
                    const detailPage =
                        document.getElementById(
                            "battleDetailPage"
                        );

                    if (
                        detailPage &&
                        !detailPage.hidden
                    ) {
                        if (
                            window.InkBoard &&
                            typeof InkBoard.goBack ===
                                "function"
                        ) {
                            InkBoard.goBack();
                        }
                    }
                }
            }
        );
    }

    // --------------------------------
    // ページUI更新
    // --------------------------------

    function updatePageUI(
        page,
        previousPage
    ) {
        updateHeader(
            page,
            previousPage
        );

        updateBottomNavigation(
            page
        );

        updateBodyPageClass(
            page
        );
    }

    // --------------------------------
    // ヘッダー
    // --------------------------------

    function updateHeader(
        page,
        previousPage
    ) {
        const title =
            document.getElementById(
                "headerTitle"
            );

        const backButton =
            document.getElementById(
                "headerBackButton"
            );

        const settingsButton =
            document.getElementById(
                "headerSettingsButton"
            );

        if (title) {
            title.textContent =
                PAGE_TITLES[page] ||
                "InkBoard";
        }

        // 詳細・設定では戻る
        const shouldShowBack =
            page === "detail" ||
            page === "settings";

        if (backButton) {
            backButton.hidden =
                !shouldShowBack;
        }

        // バトル画面では設定ボタンを表示
        if (settingsButton) {
            settingsButton.hidden =
                page === "detail" ||
                page === "settings";
        }
    }

    // --------------------------------
    // 下部ナビ
    // --------------------------------

    function updateBottomNavigation(
        page
    ) {
        const items =
            document.querySelectorAll(
                ".bottom-nav-item"
            );

        items.forEach(item => {
            const action =
                item.dataset.action;

            item.classList.remove(
                "is-active"
            );

            if (
                action === page
            ) {
                item.classList.add(
                    "is-active"
                );
            }
        });
    }

    // --------------------------------
    // bodyクラス
    // --------------------------------

    function updateBodyPageClass(
        page
    ) {
        document.body.classList.remove(
            "page-battle",
            "page-detail",
            "page-salmon",
            "page-statistics",
            "page-settings"
        );

        document.body.classList.add(
            "page-" + page
        );
    }

    // --------------------------------
    // スクロールトップ
    // --------------------------------

    function scrollTop(
        smooth
    ) {
        window.scrollTo({
            top: 0,
            behavior:
                smooth === false
                    ? "auto"
                    : "smooth"
        });
    }

    // --------------------------------
    // バトル画面更新
    // --------------------------------

    async function refresh() {
        if (
            window.Battle &&
            typeof Battle.refresh ===
                "function"
        ) {
            await Battle.refresh();
        }

        updateBattleCount();

        return true;
    }

    // --------------------------------
    // バトル件数表示
    // --------------------------------

    async function updateBattleCount() {
        if (!window.Storage) {
            return;
        }

        const count =
            await Storage.countBattles();

        const elements =
            document.querySelectorAll(
                "[data-battle-count]"
            );

        elements.forEach(
            element => {
                element.textContent =
                    String(count);
            }
        );
    }

    // --------------------------------
    // Toast
    // --------------------------------

    let toastTimer = null;

    function toast(
        message,
        type
    ) {
        const element =
            document.getElementById(
                "toast"
            );

        if (!element) {
            return;
        }

        clearTimeout(
            toastTimer
        );

        element.textContent =
            String(message || "");

        element.className =
            "toast";

        if (type) {
            element.classList.add(
                "toast-" + type
            );
        }

        // 再描画させてアニメーションを確実に開始
        void element.offsetWidth;

        element.classList.add(
            "is-visible"
        );

        toastTimer =
            setTimeout(
                function () {
                    element.classList.remove(
                        "is-visible"
                    );
                },
                2600
            );
    }

    // --------------------------------
    // Loading
    // --------------------------------

    let loadingCount = 0;

    function loading(
        visible,
        message
    ) {
        const element =
            document.getElementById(
                "loading"
            );

        if (!element) {
            return;
        }

        if (visible) {
            loadingCount++;

            if (message) {
                const text =
                    element.querySelector(
                        ".loading-text"
                    );

                if (text) {
                    text.textContent =
                        message;
                }
            }

            element.hidden = false;

            requestAnimationFrame(
                function () {
                    element.classList.add(
                        "is-visible"
                    );
                }
            );

            return;
        }

        loadingCount =
            Math.max(
                0,
                loadingCount - 1
            );

        if (loadingCount > 0) {
            return;
        }

        element.classList.remove(
            "is-visible"
        );

        setTimeout(
            function () {
                if (
                    loadingCount === 0
                ) {
                    element.hidden =
                        true;
                }
            },
            180
        );
    }

    // --------------------------------
    // Loadingを強制終了
    // --------------------------------

    function hideLoading() {
        loadingCount = 0;

        const element =
            document.getElementById(
                "loading"
            );

        if (!element) {
            return;
        }

        element.classList.remove(
            "is-visible"
        );

        element.hidden = true;
    }

    // --------------------------------
    // 空状態表示
    // --------------------------------

    function showBattleEmpty(
        visible
    ) {
        const empty =
            document.getElementById(
                "battleEmpty"
            );

        if (!empty) {
            return;
        }

        empty.hidden =
            !visible;
    }

    // --------------------------------
    // ボタンの一時無効化
    // --------------------------------

    function setDisabled(
        selector,
        disabled
    ) {
        const elements =
            document.querySelectorAll(
                selector
            );

        elements.forEach(
            element => {
                element.disabled =
                    Boolean(disabled);
            }
        );
    }

    // --------------------------------
    // 詳細ページ表示準備
    // --------------------------------

    function prepareDetailPage() {
        scrollTop(false);

        const main =
            document.getElementById(
                "mainContent"
            );

        if (main) {
            main.scrollTop = 0;
        }
    }

    // --------------------------------
    // バトルページ表示準備
    // --------------------------------

    function prepareBattlePage() {
        scrollTop(false);
    }

    // --------------------------------
    // 設定ページ表示準備
    // --------------------------------

    function prepareSettingsPage() {
        scrollTop(false);
    }

    // --------------------------------
    // ページ表示後処理
    // --------------------------------

    function onPageShown(
        page
    ) {
        switch (page) {
            case "battle":
                prepareBattlePage();
                break;

            case "detail":
                prepareDetailPage();
                break;

            case "settings":
                prepareSettingsPage();
                break;

            default:
                scrollTop(false);
                break;
        }
    }

    // --------------------------------
    // インポート完了後
    // --------------------------------

    async function onImportComplete(
        count
    ) {
        if (
            typeof count === "number"
        ) {
            toast(
                count +
                    "件のバトルを読み込みました。",
                "success"
            );
        }

        await refresh();

        if (
            window.InkBoard &&
            typeof InkBoard.showPage ===
                "function"
        ) {
            InkBoard.showPage(
                "battle"
            );
        }
    }

    // --------------------------------
    // データ削除完了後
    // --------------------------------

    async function onDataDeleted() {
        await refresh();

        toast(
            "データを削除しました。",
            "success"
        );

        if (
            window.InkBoard &&
            typeof InkBoard.showPage ===
                "function"
        ) {
            InkBoard.showPage(
                "battle"
            );
        }
    }

    // --------------------------------
    // 数値フォーマット
    // --------------------------------

    function formatNumber(
        value
    ) {
        const number =
            Number(value);

        if (
            Number.isNaN(number)
        ) {
            return "0";
        }

        return number.toLocaleString(
            "ja-JP"
        );
    }

    // --------------------------------
    // パーセントフォーマット
    // --------------------------------

    function formatPercent(
        value
    ) {
        const number =
            Number(value);

        if (
            Number.isNaN(number)
        ) {
            return "0.0%";
        }

        return (
            number.toFixed(1) +
            "%"
        );
    }

    // --------------------------------
    // 要素表示
    // --------------------------------

    function showElement(
        selector
    ) {
        const elements =
            document.querySelectorAll(
                selector
            );

        elements.forEach(
            element => {
                element.hidden = false;
            }
        );
    }

    // --------------------------------
    // 要素非表示
    // --------------------------------

    function hideElement(
        selector
    ) {
        const elements =
            document.querySelectorAll(
                selector
            );

        elements.forEach(
            element => {
                element.hidden = true;
            }
        );
    }

    // --------------------------------
    // API
    // --------------------------------

    const api = {
        init,

        updatePageUI,
        updateHeader,
        updateBottomNavigation,

        scrollTop,

        refresh,
        updateBattleCount,

        toast,

        loading,
        hideLoading,

        showBattleEmpty,

        setDisabled,

        prepareDetailPage,
        prepareBattlePage,
        prepareSettingsPage,

        onPageShown,
        onImportComplete,
        onDataDeleted,

        formatNumber,
        formatPercent,

        showElement,
        hideElement,

        get initialized() {
            return initialized;
        }
    };

    window.UI = api;

})();
