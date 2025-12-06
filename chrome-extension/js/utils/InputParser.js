/**
 * 入力解析ユーティリティ
 */
import { InvalidDateError } from "./errors.js";

export class InputParser {
    /**
     * 手動入力のパースと検証
     * @param {string|number} year
     * @param {string|number} month
     * @param {string|number} day
     * @param {string|number} hour
     * @param {string|number} minute
     * @param {string} gender
     * @param {string} birthplace
     * @returns {Object} パースされた入力データ
     */
    static parseManualInput(year, month, day, hour, minute, gender, birthplace) {
        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const parsedDay = parseInt(day, 10);

        // 時分の処理 (空の場合はnull)
        const parsedHour = (hour !== null && hour !== "" && hour !== undefined)
            ? parseInt(hour, 10)
            : null;
        const parsedMinute = (minute !== null && minute !== "" && minute !== undefined)
            ? parseInt(minute, 10)
            : null;

        // 性別の正規化
        let normalizedGender = null;
        if (gender === "male" || gender === "男性" || gender === "男") {
            normalizedGender = "男性";
        } else if (gender === "female" || gender === "女性" || gender === "女") {
            normalizedGender = "女性";
        }

        return {
            year: parsedYear,
            month: parsedMonth,
            day: parsedDay,
            hour: parsedHour,
            minute: parsedMinute,
            gender: normalizedGender, // nullの場合は呼び出し元でチェック
            birthplace: birthplace ? birthplace.trim() : null
        };
    }

    /**
     * クリップボードテキストのパース
     * @param {string} text
     * @returns {Object} パースされた入力データ
     */
    static parseClipboardText(text) {
        if (!text) {
            throw new Error("テキストが空です");
        }

        const result = {
            year: null,
            month: null,
            day: null,
            hour: null,
            minute: null,
            gender: null,
            birthplace: null
        };

        // 1. 日付の抽出 (YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日)
        const dateRegex = /(\d{4})[./年\-](\d{1,2})[./月\-](\d{1,2})/;
        const dateMatch = text.match(dateRegex);

        if (dateMatch) {
            result.year = parseInt(dateMatch[1], 10);
            result.month = parseInt(dateMatch[2], 10);
            result.day = parseInt(dateMatch[3], 10);
        } else {
            // 和暦などの対応は今後の課題
            // 昭和60年... のようなパターンも簡易的に対応するか
            const jpDateRegex = /(昭和|平成|令和)(\d{1,2}|元)年(\d{1,2})月(\d{1,2})日/;
            const jpMatch = text.match(jpDateRegex);
            if (jpMatch) {
                // 簡易的な和暦変換
                const era = jpMatch[1];
                let yearVal = jpMatch[2] === "元" ? 1 : parseInt(jpMatch[2], 10);
                let seireki = 0;

                if (era === "昭和") seireki = 1925 + yearVal;
                if (era === "平成") seireki = 1988 + yearVal;
                if (era === "令和") seireki = 2018 + yearVal;

                result.year = seireki;
                result.month = parseInt(jpMatch[3], 10);
                result.day = parseInt(jpMatch[4], 10);
            }
        }

        // 2. 時刻の抽出 (HH:mm, HH時mm分)
        // 午前/午後対応
        const timeRegex = /(?:(午前|午後)\s*)?(\d{1,2})[:時](\d{1,2})/;
        const timeMatch = text.match(timeRegex);

        if (timeMatch) {
            // マッチ結果: match[1]=午前/午後(undefinedあり), match[2]=時, match[3]=分
            // "午前"などがキャプチャグループ1になるか2になるかは正規表現によるが
            // 上記正規表現だと (午前|午後) が group 1

            let hourVal = parseInt(timeMatch[2], 10);
            const minuteVal = parseInt(timeMatch[3], 10);
            const ampm = timeMatch[1];

            if (ampm === "午後" && hourVal < 12) {
                hourVal += 12;
            } else if (ampm === "午前" && hourVal === 12) {
                hourVal = 0;
            }

            result.hour = hourVal;
            result.minute = minuteVal;
        }

        // 3. 性別の抽出
        if (text.match(/男性|男|male/i)) {
            result.gender = "男性";
        } else if (text.match(/女性|女|female/i)) {
            result.gender = "女性";
        }

        // 4. 出生地の抽出 (簡易的)
        // "出生地: 東京" のようなパターン
        const placeRegex = /出生地[:：]\s*(\S+)/;
        const placeMatch = text.match(placeRegex);
        if (placeMatch) {
            result.birthplace = placeMatch[1];
        } else {
            // テキスト全体から都道府県名を探すなどの高度な処理はスキップ
            // 一般的な都市名をいくつかチェックする程度
            const commonPlaces = ["東京", "大阪", "京都", "北海道", "福岡", "愛知", "神奈川"];
            for (const place of commonPlaces) {
                if (text.includes(place)) {
                    result.birthplace = place;
                    break;
                }
            }
        }

        return result;
    }

    /**
     * 解析結果の検証
     */
    static validateParsedInput(input) {
        if (!input.year || !input.month || !input.day) {
            throw new InvalidDateError("有効な日付が見つかりませんでした。");
        }
    }
}
