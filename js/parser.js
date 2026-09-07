/* =========================================================
   InkBoard
   js/parser.js
   Horagai Bay Data Parser
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       State
       ===================================================== */

    const state = {
        initialized: false
    };

    /* =====================================================
       Constants
       ===================================================== */

    const PARSER_VERSION = 1;

    const JSZIP_URL =
        "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

    /* =====================================================
       Basic Helpers
       ===================================================== */

    function isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function isArray(value) {
        return Array.isArray(value);
    }

    function stringValue(value, fallback = "") {
        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        return String(value);
    }

    function numberValue(value, fallback = 0) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function nullableNumber(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function booleanValue(
        value,
        fallback = false
    ) {
        if (value === null || value === undefined) {
            return fallback;
        }

        return Boolean(value);
    }

    function firstDefined(...values) {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null
            ) {
                return value;
            }
        }

        return null;
    }

    function clone(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return value;
        }

        try {
            return JSON.parse(
                JSON.stringify(value)
            );
        } catch {
            return value;
        }
    }

    /* =====================================================
       Image
       ===================================================== */

    function parseImage(value) {
        if (!value) {
            return {
                url: "",
                width: null,
                height: null
            };
        }

        if (typeof value === "string") {
            return {
                url: value,
                width: null,
                height: null
            };
        }

        if (!isObject(value)) {
            return {
                url: "",
                width: null,
                height: null
            };
        }

        return {
            url: stringValue(
                firstDefined(
                    value.url,
                    value.imageUrl,
                    value.src
                ),
                ""
            ),
            width: nullableNumber(
                value.width
            ),
            height: nullableNumber(
                value.height
            )
        };
    }

    /* =====================================================
       Color
       ===================================================== */

    function parseColor(color) {
        if (!color || !isObject(color)) {
            return null;
        }

        return {
            r: numberValue(color.r, 0),
            g: numberValue(color.g, 0),
            b: numberValue(color.b, 0),
            a: numberValue(color.a, 1)
        };
    }

    /* =====================================================
       Weapon
       ===================================================== */

    function parseSubWeapon(subWeapon) {
        if (!subWeapon) {
            return null;
        }

        return {
            id: stringValue(subWeapon.id),
            name: stringValue(subWeapon.name),
            image: parseImage(
                subWeapon.image
            )
        };
    }

    function parseSpecialWeapon(
        specialWeapon
    ) {
        if (!specialWeapon) {
            return null;
        }

        return {
            id: stringValue(
                specialWeapon.id
            ),
            name: stringValue(
                specialWeapon.name
            ),
            image: parseImage(
                specialWeapon.image
            ),
            maskingImage: parseImage(
                specialWeapon.maskingImage
            ),
            overlayImage: parseImage({
                url: firstDefined(
                    specialWeapon
                        .maskingImage
                        ?.overlayImageUrl
                )
            })
        };
    }

    function parseWeapon(weapon) {
        if (!weapon) {
            return {
                id: "",
                name: "",
                image: {
                    url: "",
                    width: null,
                    height: null
                },
                image2d: {
                    url: "",
                    width: null,
                    height: null
                },
                image3d: {
                    url: "",
                    width: null,
                    height: null
                },
                image2dThumbnail: {
                    url: "",
                    width: null,
                    height: null
                },
                image3dThumbnail: {
                    url: "",
                    width: null,
                    height: null
                },
                subWeapon: null,
                specialWeapon: null
            };
        }

        return {
            id: stringValue(weapon.id),

            name: stringValue(
                weapon.name
            ),

            /*
             * 通常の一覧ではイラスト画像を使用。
             */
            image: parseImage(
                weapon.image
            ),

            image2d: parseImage(
                weapon.image2d
            ),

            image3d: parseImage(
                weapon.image3d
            ),

            image2dThumbnail: parseImage(
                weapon.image2dThumbnail
            ),

            image3dThumbnail: parseImage(
                weapon.image3dThumbnail
            ),

            subWeapon:
                parseSubWeapon(
                    weapon.subWeapon
                ),

            specialWeapon:
                parseSpecialWeapon(
                    weapon.specialWeapon
                )
        };
    }

    /* =====================================================
       Gear
       ===================================================== */

    function parseGearPower(power) {
        if (!power) {
            return null;
        }

        return {
            name: stringValue(
                power.name
            ),
            description: stringValue(
                firstDefined(
                    power.desc,
                    power.description
                )
            ),
            image: parseImage(
                power.image
            )
        };
    }

    function parseGear(gear) {
        if (!gear) {
            return null;
        }

        return {
            name: stringValue(
                gear.name
            ),

            image: parseImage(
                firstDefined(
                    gear.image,
                    gear.thumbnailImage,
                    gear.originalImage
                )
            ),

            thumbnailImage: parseImage(
                gear.thumbnailImage
            ),

            originalImage: parseImage(
                gear.originalImage
            ),

            brand: gear.brand
                ? {
                    id: stringValue(
                        gear.brand.id
                    ),
                    name: stringValue(
                        gear.brand.name
                    ),
                    image: parseImage(
                        gear.brand.image
                    )
                }
                : null,

            primaryGearPower:
                parseGearPower(
                    gear.primaryGearPower
                ),

            additionalGearPowers:
                isArray(
                    gear.additionalGearPowers
                )
                    ? gear.additionalGearPowers
                        .map(
                            parseGearPower
                        )
                        .filter(Boolean)
                    : [],

            usualGearPower:
                parseGearPower(
                    gear.usualGearPower
                )
        };
    }

    /* =====================================================
       Nameplate
       ===================================================== */

    function parseNameplate(
        nameplate
    ) {
        if (!nameplate) {
            return {
                badges: [],
                background: null
            };
        }

        return {
            badges: isArray(
                nameplate.badges
            )
                ? nameplate.badges
                    .map((badge) => ({
                        id: stringValue(
                            badge?.id
                        ),
                        image: parseImage(
                            badge?.image
                        )
                    }))
                    .filter(
                        (badge) =>
                            badge.id ||
                            badge.image.url
                    )
                : [],

            background:
                nameplate.background
                    ? {
                        id: stringValue(
                            nameplate
                                .background
                                .id
                        ),
                        image:
                            parseImage(
                                nameplate
                                    .background
                                    .image
                            ),
                        textColor:
                            parseColor(
                                nameplate
                                    .background
                                    .textColor
                            )
                    }
                    : null
        };
    }

    /* =====================================================
       Player Result
       ===================================================== */

    function parsePlayerResult(
        result
    ) {
        return {
            kill: numberValue(
                result?.kill,
                0
            ),

            assist: numberValue(
                result?.assist,
                0
            ),

            death: numberValue(
                result?.death,
                0
            ),

            special: numberValue(
                result?.special,
                0
            ),

            noroshiTry: numberValue(
                result?.noroshiTry,
                0
            )
        };
    }

    /* =====================================================
       Player
       ===================================================== */

    function parsePlayer(player) {
        if (!player) {
            return null;
        }

        return {
            id: stringValue(
                player.id
            ),

            name: stringValue(
                player.name
            ),

            callSign: stringValue(
                player.callSign
            ),

            byname: stringValue(
                player.byname
            ),

            nameId: stringValue(
                player.nameId
            ),

            species: stringValue(
                player.species
            ),

            isMyself:
                booleanValue(
                    player.isMyself
                ),

            crown:
                booleanValue(
                    player.crown
                ),

            festDragonCert:
                stringValue(
                    player.festDragonCert
                ),

            weapon:
                parseWeapon(
                    player.weapon
                ),

            result:
                parsePlayerResult(
                    player.result
                ),

            paint: numberValue(
                player.paint,
                0
            ),

            nameplate:
                parseNameplate(
                    player.nameplate
                ),

            gear: {
                head:
                    parseGear(
                        player.headGear
                    ),

                clothing:
                    parseGear(
                        player.clothingGear
                    ),

                shoes:
                    parseGear(
                        player.shoesGear
                    )
            }
        };
    }

    /* =====================================================
       Team Result
       ===================================================== */

    function parseTeamResult(
        result
    ) {
        return {
            paintRatio:
                nullableNumber(
                    result?.paintRatio
                ),

            score:
                nullableNumber(
                    result?.score
                ),

            noroshi:
                numberValue(
                    result?.noroshi,
                    0
                )
        };
    }

    /* =====================================================
       Team
       ===================================================== */

    function parseTeam(
        team,
        index = 0,
        isMyTeam = false
    ) {
        if (!team) {
            return null;
        }

        return {
            index,

            isMyTeam,

            color:
                parseColor(
                    team.color
                ),

            result:
                parseTeamResult(
                    team.result
                ),

            judgement:
                stringValue(
                    team.judgement
                ),

            tricolorRole:
                stringValue(
                    team.tricolorRole
                ),

            festTeamName:
                stringValue(
                    team.festTeamName
                ),

            festUniformName:
                stringValue(
                    team.festUniformName
                ),

            festUniformBonusRate:
                nullableNumber(
                    team.festUniformBonusRate
                ),

            order: numberValue(
                team.order,
                index
            ),

            festStreakWinCount:
                numberValue(
                    team.festStreakWinCount,
                    0
                ),

            players: isArray(
                team.players
            )
                ? team.players
                    .map(parsePlayer)
                    .filter(Boolean)
                : []
        };
    }

    /* =====================================================
       Stage
       ===================================================== */

    function parseStage(stage) {
        if (!stage) {
            return {
                id: "",
                name: "",
                image: {
                    url: "",
                    width: null,
                    height: null
                }
            };
        }

        return {
            id: stringValue(
                stage.id
            ),

            name: stringValue(
                stage.name
            ),

            image: parseImage(
                stage.image
            )
        };
    }

    /* =====================================================
       Rule / Mode
       ===================================================== */

    function parseRule(rule) {
        if (!rule) {
            return {
                id: "",
                name: "",
                rule: ""
            };
        }

        return {
            id: stringValue(
                rule.id
            ),

            name: stringValue(
                rule.name
            ),

            rule: stringValue(
                rule.rule
            )
        };
    }

    function parseMode(mode) {
        if (!mode) {
            return {
                id: "",
                mode: ""
            };
        }

        return {
            id: stringValue(
                mode.id
            ),

            mode: stringValue(
                mode.mode
            )
        };
    }

    /* =====================================================
       Fest Match
       ===================================================== */

    function parseFestMatch(
        festMatch
    ) {
        if (!festMatch) {
            return null;
        }

        return {
            conchShell:
                nullableNumber(
                    festMatch.conchShell
                ),

            dragonMatchType:
                stringValue(
                    festMatch.dragonMatchType
                ),

            contribution:
                nullableNumber(
                    festMatch.contribution
                ),

            jewel:
                nullableNumber(
                    festMatch.jewel
                ),

            myFestPower:
                nullableNumber(
                    festMatch.myFestPower
                )
        };
    }

    /* =====================================================
       Other Match Data
       ===================================================== */

    function parseMatchObject(
        value
    ) {
        if (!value) {
            return null;
        }

        return clone(value);
    }

    /* =====================================================
       Awards
       ===================================================== */

    function parseAwards(awards) {
        if (!isArray(awards)) {
            return [];
        }

        return awards.map(
            (award, index) => {
                if (
                    typeof award ===
                    "string"
                ) {
                    return {
                        index,
                        name: award,
                        id: "",
                        image: {
                            url: ""
                        },
                        raw: award
                    };
                }

                return {
                    index,

                    id: stringValue(
                        award?.id
                    ),

                    name: stringValue(
                        firstDefined(
                            award?.name,
                            award?.title
                        )
                    ),

                    image:
                        parseImage(
                            award?.image
                        ),

                    rarity:
                        stringValue(
                            firstDefined(
                                award?.rarity,
                
