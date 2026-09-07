// ===============================
// InkBoard
// analyzer.js
// Battle Analysis Engine
// ===============================

(function () {
    "use strict";

    let initialized = false;

    // --------------------------------
    // 初期化
    // --------------------------------

    function init() {
        initialized = true;
        return true;
    }

    // --------------------------------
    // 数値化
    // --------------------------------

    function number(value) {
        const n = Number(value);

        if (Number.isNaN(n)) {
            return 0;
        }

        return n;
    }

    // --------------------------------
    // 配列化
    // --------------------------------

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    // --------------------------------
    // 勝利判定
    // --------------------------------

    function isWin(battle) {
        if (!battle) {
            return false;
        }

        return String(battle.result).toUpperCase() === "WIN";
    }

    // --------------------------------
    // 敗北判定
    // --------------------------------

    function isLose(battle) {
        if (!battle) {
            return false;
        }

        return String(battle.result).toUpperCase() === "LOSE";
    }

    // --------------------------------
    // バトル数
    // --------------------------------

    function countBattles(battles) {
        return toArray(battles).length;
    }

    // --------------------------------
    // 勝利数
    // --------------------------------

    function countWins(battles) {
        return toArray(battles).filter(isWin).length;
    }

    // --------------------------------
    // 敗北数
    // --------------------------------

    function countLoses(battles) {
        return toArray(battles).filter(isLose).length;
    }

    // --------------------------------
    // 勝率
    // --------------------------------

    function getWinRate(battles) {
        const list = toArray(battles);

        if (list.length === 0) {
            return 0;
        }

        return (countWins(list) / list.length) * 100;
    }

    // --------------------------------
    // 平均値
    // --------------------------------

    function average(values) {
        const list = toArray(values)
            .map(number)
            .filter(value => Number.isFinite(value));

        if (list.length === 0) {
            return 0;
        }

        return list.reduce(
            (sum, value) => sum + value,
            0
        ) / list.length;
    }

    // --------------------------------
    // 自分のプレイヤー取得
    // --------------------------------

    function getMyPlayer(battle) {
        if (!battle) {
            return null;
        }

        if (battle.player) {
            return battle.player;
        }

        const teams = toArray(battle.teams);

        for (const team of teams) {
            const players = toArray(team.players);

            for (const player of players) {
                if (player.isMyself === true) {
                    return player;
                }
            }
        }

        return null;
    }

    // --------------------------------
    // プレイヤー成績取得
    // --------------------------------

    function getPlayerResult(player) {
        if (!player || !player.result) {
            return {
                kill: 0,
                assist: 0,
                death: 0,
                special: 0,
                noroshiTry: 0,
                paint: number(player?.paint)
            };
        }

        return {
            kill: number(player.result.kill),
            assist: number(player.result.assist),
            death: number(player.result.death),
            special: number(player.result.special),
            noroshiTry: number(player.result.noroshiTry),
            paint: number(player.paint)
        };
    }

    // --------------------------------
    // 自分の成績
    // --------------------------------

    function getBattleStats(battle) {
        const player = getMyPlayer(battle);

        return getPlayerResult(player);
    }

    // --------------------------------
    // 合計キル
    // --------------------------------

    function getTotalKills(battles) {
        return toArray(battles).reduce(
            (sum, battle) =>
                sum + getBattleStats(battle).kill,
            0
        );
    }

    // --------------------------------
    // 合計アシスト
    // --------------------------------

    function getTotalAssists(battles) {
        return toArray(battles).reduce(
            (sum, battle) =>
                sum + getBattleStats(battle).assist,
            0
        );
    }

    // --------------------------------
    // 合計デス
    // --------------------------------

    function getTotalDeaths(battles) {
        return toArray(battles).reduce(
            (sum, battle) =>
                sum + getBattleStats(battle).death,
            0
        );
    }

    // --------------------------------
    // 合計スペシャル
    // --------------------------------

    function getTotalSpecials(battles) {
        return toArray(battles).reduce(
            (sum, battle) =>
                sum + getBattleStats(battle).special,
            0
        );
    }

    // --------------------------------
    // 合計塗り
    // --------------------------------

    function getTotalPaint(battles) {
        return toArray(battles).reduce(
            (sum, battle) =>
                sum + getBattleStats(battle).paint,
            0
        );
    }

    // --------------------------------
    // 平均キル
    // --------------------------------

    function getAverageKills(battles) {
        return average(
            toArray(battles).map(
                battle => getBattleStats(battle).kill
            )
        );
    }

    // --------------------------------
    // 平均アシスト
    // --------------------------------

    function getAverageAssists(battles) {
        return average(
            toArray(battles).map(
                battle => getBattleStats(battle).assist
            )
        );
    }

    // --------------------------------
    // 平均デス
    // --------------------------------

    function getAverageDeaths(battles) {
        return average(
            toArray(battles).map(
                battle => getBattleStats(battle).death
            )
        );
    }

    // --------------------------------
    // 平均スペシャル
    // --------------------------------

    function getAverageSpecials(battles) {
        return average(
            toArray(battles).map(
                battle => getBattleStats(battle).special
            )
        );
    }

    // --------------------------------
    // 平均塗り
    // --------------------------------

    function getAveragePaint(battles) {
        return average(
            toArray(battles).map(
                battle => getBattleStats(battle).paint
            )
        );
    }

    // --------------------------------
    // K/D
    // --------------------------------

    function getKD(battles) {
        const kills = getTotalKills(battles);
        const deaths = getTotalDeaths(battles);

        if (deaths === 0) {
            return kills;
        }

        return kills / deaths;
    }

    // --------------------------------
    // K/D/A
    // --------------------------------

    function getKDA(battles) {
        const kills = getTotalKills(battles);
        const assists = getTotalAssists(battles);
        const deaths = getTotalDeaths(battles);

        return {
            kill: kills,
            assist: assists,
            death: deaths,
            ratio:
                deaths === 0
                    ? kills + assists
                    : (kills + assists) / deaths
        };
    }

    // --------------------------------
    // キル＋アシスト
    // --------------------------------

    function getKillAssist(battles) {
        return (
            getTotalKills(battles) +
            getTotalAssists(battles)
        );
    }

    // --------------------------------
    // SP / D
    // --------------------------------

    function getSpecialPerDeath(battles) {
        const specials = getTotalSpecials(battles);
        const deaths = getTotalDeaths(battles);

        if (deaths === 0) {
            return specials;
        }

        return specials / deaths;
    }

    // --------------------------------
    // Paint / Death
    // --------------------------------

    function getPaintPerDeath(battles) {
        const paint = getTotalPaint(battles);
        const deaths = getTotalDeaths(battles);

        if (deaths === 0) {
            return paint;
        }

        return paint / deaths;
    }

    // --------------------------------
    // Tricolor判定
    // --------------------------------

    function isTricolor(battle) {
        return battle?.isTricolor === true;
    }

    // --------------------------------
    // 通常バトルのみ
    // --------------------------------

    function getNormalBattles(battles) {
        return toArray(battles).filter(
            battle => !isTricolor(battle)
        );
    }

    // --------------------------------
    // トリカラのみ
    // --------------------------------

    function getTricolorBattles(battles) {
        return toArray(battles).filter(
            battle => isTricolor(battle)
        );
    }

    // --------------------------------
    // ルール別
    // --------------------------------

    function filterByRule(battles, rule) {
        if (!rule) {
            return toArray(battles);
        }

        return toArray(battles).filter(
            battle =>
                battle?.rule?.name === rule ||
                battle?.rule?.rule === rule
        );
    }

    // --------------------------------
    // モード別
    // --------------------------------

    function filterByMode(battles, mode) {
        if (!mode) {
            return toArray(battles);
        }

        return toArray(battles).filter(
            battle =>
                battle?.mode?.mode === mode
        );
    }

    // --------------------------------
    // ステージ別
    // --------------------------------

    function filterByStage(battles, stage) {
        if (!stage) {
            return toArray(battles);
        }

        return toArray(battles).filter(
            battle =>
                battle?.stage?.name === stage
        );
    }

    // --------------------------------
    // 武器別
    // --------------------------------

    function filterByWeapon(battles, weapon) {
        if (!weapon) {
            return toArray(battles);
        }

        return toArray(battles).filter(
            battle =>
                getMyPlayer(battle)?.weapon?.name === weapon
        );
    }

    // --------------------------------
    // 指定期間
    // --------------------------------

    function filterByDateRange(
        battles,
        startDate,
        endDate
    ) {
        const start = startDate
            ? new Date(startDate).getTime()
            : -Infinity;

        const end = endDate
            ? new Date(endDate).getTime()
            : Infinity;

        return toArray(battles).filter(battle => {
            const time = parseDateValue(
                battle.playedTime
            );

            return time >= start && time <= end;
        });
    }

    // --------------------------------
    // 日付変換
    // --------------------------------

    function parseDateValue(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
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
    // 武器別統計
    // --------------------------------

    function analyzeByWeapon(battles) {
        const map = new Map();

        for (const battle of toArray(battles)) {
            const player = getMyPlayer(battle);
            const weaponName =
                player?.weapon?.name || "不明";

            if (!map.has(weaponName)) {
                map.set(
                    weaponName,
                    []
                );
            }

            map.get(weaponName).push(battle);
        }

        return Array.from(
            map.entries()
        ).map(([weapon, list]) => ({
            weapon,
            battles: countBattles(list),
            wins: countWins(list),
            loses: countLoses(list),
            winRate: getWinRate(list),

            averageKills:
                getAverageKills(list),

            averageAssists:
                getAverageAssists(list),

            averageDeaths:
                getAverageDeaths(list),

            averageSpecials:
                getAverageSpecials(list),

            averagePaint:
                getAveragePaint(list),

            kd:
                getKD(list)
        })).sort(
            (a, b) =>
                b.battles - a.battles
        );
    }

    // --------------------------------
    // ステージ別統計
    // --------------------------------

    function analyzeByStage(battles) {
        const map = new Map();

        for (const battle of toArray(battles)) {
            const stage =
                battle?.stage?.name || "不明";

            if (!map.has(stage)) {
                map.set(stage, []);
            }

            map.get(stage).push(battle);
        }

        return Array.from(
            map.entries()
        ).map(([stage, list]) => ({
            stage,
            battles: countBattles(list),
            wins: countWins(list),
            loses: countLoses(list),
            winRate: getWinRate(list),

            averageKills:
                getAverageKills(list),

            averageDeaths:
                getAverageDeaths(list),

            averageSpecials:
                getAverageSpecials(list),

            averagePaint:
                getAveragePaint(list),

            kd:
                getKD(list)
        })).sort(
            (a, b) =>
                b.battles - a.battles
        );
    }

    // --------------------------------
    // ルール別統計
    // --------------------------------

    function analyzeByRule(battles) {
        const map = new Map();

        for (const battle of toArray(battles)) {
            const rule =
                battle?.rule?.name || "不明";

            if (!map.has(rule)) {
                map.set(rule, []);
            }

            map.get(rule).push(battle);
        }

        return Array.from(
            map.entries()
        ).map(([rule, list]) => ({
            rule,
            battles: countBattles(list),
            wins: countWins(list),
            loses: countLoses(list),
            winRate: getWinRate(list),

            averageKills:
                getAverageKills(list),

            averageDeaths:
                getAverageDeaths(list),

            averageSpecials:
                getAverageSpecials(list),

            averagePaint:
                getAveragePaint(list),

            kd:
                getKD(list)
        })).sort(
            (a, b) =>
                b.battles - a.battles
        );
    }

    // --------------------------------
    // モード別統計
    // --------------------------------

    function analyzeByMode(battles) {
        const map = new Map();

        for (const battle of toArray(battles)) {
            const mode =
                battle?.mode?.mode || "不明";

            if (!map.has(mode)) {
                map.set(mode, []);
            }

            map.get(mode).push(battle);
        }

        return Array.from(
            map.entries()
        ).map(([mode, list]) => ({
            mode,
            battles: countBattles(list),
            wins: countWins(list),
            loses: countLoses(list),
            winRate: getWinRate(list),

            averageKills:
                getAverageKills(list),

            averageDeaths:
                getAverageDeaths(list),

            averageSpecials:
                getAverageSpecials(list),

            averagePaint:
                getAveragePaint(list),

            kd:
                getKD(list)
        })).sort(
            (a, b) =>
                b.battles - a.battles
        );
    }

    // --------------------------------
    // 総合分析
    // --------------------------------

    function analyze(battles) {
        const list = toArray(battles);

        return {
            battles: countBattles(list),

            wins: countWins(list),

            loses: countLoses(list),

            winRate:
                getWinRate(list),

            tricolorBattles:
                getTricolorBattles(list).length,

            normalBattles:
                getNormalBattles(list).length,

            totalKills:
                getTotalKills(list),

            totalAssists:
                getTotalAssists(list),

            totalDeaths:
                getTotalDeaths(list),

            totalSpecials:
                getTotalSpecials(list),

            totalPaint:
                getTotalPaint(list),

            averageKills:
                getAverageKills(list),

            averageAssists:
                getAverageAssists(list),

            averageDeaths:
                getAverageDeaths(list),

            averageSpecials:
                getAverageSpecials(list),

            averagePaint:
                getAveragePaint(list),

            kd:
                getKD(list),

            kda:
                getKDA(list),

            specialPerDeath:
                getSpecialPerDeath(list),

            paintPerDeath:
                getPaintPerDeath(list)
        };
    }

    // --------------------------------
    // API
    // --------------------------------

    const api = {
        init,

        number,
        average,

        isWin,
        isLose,
        isTricolor,

        countBattles,
        countWins,
        countLoses,
        getWinRate,

        getMyPlayer,
        getPlayerResult,
        getBattleStats,

        getTotalKills,
        getTotalAssists,
        getTotalDeaths,
        getTotalSpecials,
        getTotalPaint,

        getAverageKills,
        getAverageAssists,
        getAverageDeaths,
        getAverageSpecials,
        getAveragePaint,

        getKD,
        getKDA,
        getKillAssist,
        getSpecialPerDeath,
        getPaintPerDeath,

        getNormalBattles,
        getTricolorBattles,

        filterByRule,
        filterByMode,
        filterByStage,
        filterByWeapon,
        filterByDateRange,

        analyzeByWeapon,
        analyzeByStage,
        analyzeByRule,
        analyzeByMode,

        analyze,

        get initialized() {
            return initialized;
        }
    };

    window.Analyzer = api;

})();
