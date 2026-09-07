// ===============================
// InkBoard
// battle.js
// Battle History / Detail System
// ===============================

(function () {
    "use strict";

    let initialized = false;
    let allBattles = [];
    let filteredBattles = [];
    let currentBattle = null;

    // --------------------------------
    // 初期化
    // --------------------------------

    async function init() {
        initialized = true;

        bindFilters();

        await refresh();

        return true;
    }

    // --------------------------------
    // バトル一覧更新
    // --------------------------------

    async function refresh() {
        if (!window.Storage) {
            return;
        }

        try {
            allBattles = await Storage.getBattles();

            applyCurrentFilter();

            renderSummary();

            renderBattleList();

            return allBattles;
        } catch (error) {
            console.error(
                "Battle.refresh error:",
                error
            );

            showToast(
                "バトルデータの読み込みに失敗しました。",
                "error"
            );

            return [];
        }
    }

    // --------------------------------
    // 現在のフィルター取得
    // --------------------------------

    function getCurrentFilter() {
        const activeButton =
            document.querySelector(
                '[data-battle-filter].is-active'
            );

        if (!activeButton) {
            return "all";
        }

        return (
            activeButton.dataset.battleFilter ||
            "all"
        );
    }

    // --------------------------------
    // フィルター適用
    // --------------------------------

    function applyCurrentFilter() {
        const filter = getCurrentFilter();

        filteredBattles =
            filterBattles(
                allBattles,
                filter
            );
    }

    // --------------------------------
    // フィルター処理
    // --------------------------------

    function filterBattles(
        battles,
        filter
    ) {
        const list =
            Array.isArray(battles)
                ? battles
                : [];

        switch (filter) {
            case "rule":
                return list.filter(
                    battle =>
                        battle?.rule?.name ||
                        battle?.rule?.rule
                );

            case "mode":
                return list.filter(
                    battle =>
                        battle?.mode?.mode
                );

            case "weapon":
                return list.filter(
                    battle =>
                        getMyPlayer(battle)
                            ?.weapon
                            ?.name
                );

            case "tricolor":
                return list.filter(
                    battle =>
                        battle?.isTricolor === true
                );

            case "all":
            default:
                return list;
        }
    }

    // --------------------------------
    // フィルターボタン
    // --------------------------------

    function bindFilters() {
        const buttons =
            document.querySelectorAll(
                "[data-battle-filter]"
            );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    buttons.forEach(
                        item => {
                            item.classList.remove(
                                "is-active"
                            );
                        }
                    );

                    button.classList.add(
                        "is-active"
                    );

                    applyCurrentFilter();

                    renderSummary();

                    renderBattleList();
                }
            );
        });
    }

    // --------------------------------
    // サマリー表示
    // --------------------------------

    function renderSummary() {
        const total =
            filteredBattles.length;

        const wins =
            filteredBattles.filter(
                battle =>
                    isWin(battle)
            ).length;

        const loses =
            filteredBattles.filter(
                battle =>
                    isLose(battle)
            ).length;

        const winRate =
            total > 0
                ? (wins / total) * 100
                : 0;

        setText(
            "summaryBattles",
            String(total)
        );

        setText(
            "summaryWins",
            String(wins)
        );

        setText(
            "summaryLoses",
            String(loses)
        );

        setText(
            "summaryWinRate",
            formatPercent(winRate)
        );
    }

    // --------------------------------
    // バトル一覧
    // --------------------------------

    function renderBattleList() {
        const container =
            document.getElementById(
                "battleList"
            );

        const empty =
            document.getElementById(
                "battleEmpty"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (filteredBattles.length === 0) {
            if (empty) {
                empty.hidden = false;
            }

            return;
        }

        if (empty) {
            empty.hidden = true;
        }

        const fragment =
            document.createDocumentFragment();

        filteredBattles.forEach(
            battle => {
                const row =
                    createBattleRow(
                        battle
                    );

                fragment.appendChild(row);
            }
        );

        container.appendChild(fragment);
    }

    // --------------------------------
    // バトル行生成
    // --------------------------------

    function createBattleRow(battle) {
        const row =
            document.createElement("button");

        row.type = "button";

        row.className =
            "battle-row";

        row.dataset.battleId =
            battle.id;

        const result =
            normalizeResult(
                battle.result
            );

        const resultClass =
            result === "WIN"
                ? "is-win"
                : result === "LOSE"
                    ? "is-lose"
                    : "is-unknown";

        const resultText =
            result === "WIN"
                ? "WIN"
                : result === "LOSE"
                    ? "LOSE"
                    : "—";

        const player =
            getMyPlayer(battle);

        const stats =
            getPlayerStats(player);

        const weapon =
            player?.weapon;

        const stage =
            battle?.stage;

        const rule =
            battle?.rule;

        const mode =
            battle?.mode;

        const tricolor =
            battle?.isTricolor === true;

        const time =
            formatDateTime(
                battle.playedTime
            );

        const weaponImage =
            weapon?.image || "";

        const stageImage =
            stage?.image || "";

        row.innerHTML = `
            <div class="battle-row-result ${resultClass}">
                <span class="battle-row-result-main">
                    ${escapeHTML(resultText)}
                </span>
                ${
                    tricolor
                        ? `
                            <span class="battle-row-tricolor">
                                トリカラ
                            </span>
                        `
                        : ""
                }
            </div>

            <div class="battle-row-main">

                <div class="battle-row-stage">
                    ${
                        stageImage
                            ? `
                                <img
                                    src="${escapeAttribute(stageImage)}"
                                    alt=""
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="battle-row-stage-placeholder">
                                    <span class="material-symbols-rounded">
                                        image
                                    </span>
                                </div>
                            `
                    }
                </div>

                <div class="battle-row-info">

                    <div class="battle-row-title">
                        ${escapeHTML(
                            stage?.name || "不明なステージ"
                        )}
                    </div>

                    <div class="battle-row-rule">
                        ${escapeHTML(
                            rule?.name ||
                            rule?.rule ||
                            "ルール不明"
                        )}
                    </div>

                    <div class="battle-row-meta">
                        <span>
                            ${escapeHTML(
                                getModeName(mode)
                            )}
                        </span>

                        <span class="battle-row-dot">
                            ·
                        </span>

                        <span>
                            ${escapeHTML(time)}
                        </span>
                    </div>

                </div>

                <div class="battle-row-weapon">

                    ${
                        weaponImage
                            ? `
                                <img
                                    src="${escapeAttribute(weaponImage)}"
                                    alt="${escapeAttribute(
                                        weapon?.name || ""
                                    )}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <span class="material-symbols-rounded">
                                    sports_esports
                                </span>
                            `
                    }

                </div>

            </div>

            <div class="battle-row-stats">

                <span class="battle-stat">
                    <strong>
                        ${stats.kill}
                    </strong>
                    <small>キル</small>
                </span>

                <span class="battle-stat">
                    <strong>
                        ${stats.assist}
                    </strong>
                    <small>アシスト</small>
                </span>

                <span class="battle-stat">
                    <strong>
                        ${stats.death}
                    </strong>
                    <small>デス</small>
                </span>

                <span class="battle-stat">
                    <strong>
                        ${stats.special}
                    </strong>
                    <small>SP</small>
                </span>

                <span class="battle-stat">
                    <strong>
                        ${stats.paint}
                    </strong>
                    <small>塗り</small>
                </span>

            </div>
        `;

        return row;
    }

    // --------------------------------
    // 詳細表示
    // --------------------------------

    async function showDetail(id) {
        if (!id) {
            return null;
        }

        let battle =
            allBattles.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!battle && window.Storage) {
            battle =
                await Storage.getBattle(id);
        }

        if (!battle) {
            showToast(
                "バトルデータが見つかりません。",
                "error"
            );

            return null;
        }

        currentBattle = battle;

        renderDetail(battle);

        if (window.InkBoard) {
            InkBoard.showBattleDetail();
        }

        return battle;
    }

    // --------------------------------
    // 詳細描画
    // --------------------------------

    function renderDetail(battle) {
        const container =
            document.getElementById(
                "battleDetail"
            );

        if (!container) {
            return;
        }

        const player =
            getMyPlayer(battle);

        const stats =
            getPlayerStats(player);

        const result =
            normalizeResult(
                battle.result
            );

        const resultClass =
            result === "WIN"
                ? "is-win"
                : result === "LOSE"
                    ? "is-lose"
                    : "is-unknown";

        const resultText =
            result === "WIN"
                ? "WIN"
                : result === "LOSE"
                    ? "LOSE"
                    : "—";

        const stage =
            battle.stage || {};

        const rule =
            battle.rule || {};

        const mode =
            battle.mode || {};

        const teams =
            Array.isArray(battle.teams)
                ? battle.teams
                : [];

        const tricolor =
            battle.isTricolor === true;

        container.innerHTML = `
            <section class="battle-detail-header">

                <div class="battle-detail-stage">

                    ${
                        stage.image
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        stage.image
                                    )}"
                                    alt="${escapeAttribute(
                                        stage.name || ""
                                    )}"
                                >
                            `
                            : `
                                <div class="battle-detail-stage-placeholder">
                                    <span class="material-symbols-rounded">
                                        image
                                    </span>
                                </div>
                            `
                    }

                    <div class="battle-detail-stage-overlay">
                        <div>
                            <span class="battle-detail-stage-name">
                                ${escapeHTML(
                                    stage.name ||
                                    "不明なステージ"
                                )}
                            </span>

                            <span class="battle-detail-rule-name">
                                ${escapeHTML(
                                    rule.name ||
                                    rule.rule ||
                                    "ルール不明"
                                )}
                            </span>
                        </div>

                        <div class="
                            battle-detail-result
                            ${resultClass}
                        ">
                            ${escapeHTML(resultText)}
                        </div>
                    </div>

                </div>

                <div class="battle-detail-summary">

                    <div>
                        <span>日時</span>
                        <strong>
                            ${escapeHTML(
                                formatDateTime(
                                    battle.playedTime
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>モード</span>
                        <strong>
                            ${escapeHTML(
                                getModeName(mode)
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>試合時間</span>
                        <strong>
                            ${escapeHTML(
                                formatDuration(
                                    battle.duration
                                )
                            )}
                        </strong>
                    </div>

                </div>

            </section>

            <section class="battle-detail-player">

                <div class="section-title">
                    <span class="material-symbols-rounded">
                        person
                    </span>
                    自分の結果
                </div>

                ${createPlayerCard(
                    player,
                    true
                )}

                <div class="player-result-grid">

                    <div>
                        <strong>
                            ${stats.kill}
                        </strong>
                        <span>キル</span>
                    </div>

                    <div>
                        <strong>
                            ${stats.assist}
                        </strong>
                        <span>アシスト</span>
                    </div>

                    <div>
                        <strong>
                            ${stats.death}
                        </strong>
                        <span>デス</span>
                    </div>

                    <div>
                        <strong>
                            ${stats.special}
                        </strong>
                        <span>SP</span>
                    </div>

                    <div>
                        <strong>
                            ${stats.paint}
                        </strong>
                        <span>塗り</span>
                    </div>

                </div>

            </section>

            ${
                tricolor
                    ? createTricolorTeams(
                        battle
                    )
                    : createNormalTeams(
                        teams,
                        player
                    )
            }

            ${
                createAwards(
                    battle.awards
                )
            }

            <section class="battle-detail-extra">

                ${
                    battle.knockout !== null &&
                    battle.knockout !== undefined
                        ? `
                            <div class="detail-info-row">
                                <span>ノックアウト</span>
                                <strong>
                                    ${battle.knockout ? "あり" : "なし"}
                                </strong>
                            </div>
                        `
                        : ""
                }

                ${
                    battle.festMatch
                        ? createFestInfo(
                            battle.festMatch
                        )
                        : ""
                }

            </section>
        `;
    }

    // --------------------------------
    // 通常バトルのチーム
    // --------------------------------

    function createNormalTeams(
        teams,
        myPlayer
    ) {
        if (!teams.length) {
            return `
                <section class="battle-detail-teams">
                    <div class="section-title">
                        <span class="material-symbols-rounded">
                            groups
                        </span>
                        プレイヤー
                    </div>

                    <div class="t
