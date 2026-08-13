/**
 * 入力解析ユーティリティ
 */
import { InvalidDateError } from "./errors.js";
import { DEFAULT_SHI_MODE } from "./constants.js";
import { TimeCorrectionService } from "../core/TimeCorrectionService.js";

function isBlank(value) {
    return value === null || value === undefined || value === "";
}

export class InputParser {
    /**
     * 手動入力のパース
     * @param {string|number} year
     * @param {string|number} month
     * @param {string|number} day
     * @param {string|number} hour
     * @param {string|number} minute
     * @param {string} gender
     * @param {object} extras
     * @returns {Object} パースされた入力データ
     */
    static parseManualInput(year, month, day, hour, minute, gender, extras = {}) {
        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const parsedDay = parseInt(day, 10);

        const parsedHour = isBlank(hour) ? null : parseInt(hour, 10);
        const parsedMinute = isBlank(minute) ? null : parseInt(minute, 10);

        let normalizedGender = null;
        if (gender === "male" || gender === "男性" || gender === "男") {
            normalizedGender = "男性";
        } else if (gender === "female" || gender === "女性" || gender === "女") {
            normalizedGender = "女性";
        }

        const prefectureRaw = extras.prefectureCode;
        const prefectureCode = isBlank(prefectureRaw) ? null : String(prefectureRaw).trim();

        const tzSign = isBlank(extras.tzSign) ? "+" : extras.tzSign;
        const tzHour = isBlank(extras.tzHour) ? 0 : extras.tzHour;
        const tzMinute = isBlank(extras.tzMinute) ? 0 : extras.tzMinute;
        const offsetMinutes = TimeCorrectionService.parseOffset(tzSign, tzHour, tzMinute);

        let shiMode = extras.shiMode;
        if (isBlank(shiMode)) {
            shiMode = DEFAULT_SHI_MODE;
        }

        return {
            year: parsedYear,
            month: parsedMonth,
            day: parsedDay,
            hour: parsedHour,
            minute: parsedMinute,
            gender: normalizedGender,
            prefectureCode,
            offsetMinutes,
            tzSign,
            tzHour: isBlank(extras.tzHour) ? 0 : Number(extras.tzHour),
            tzMinute: isBlank(extras.tzMinute) ? 0 : Number(extras.tzMinute),
            shiMode,
        };
    }

    /**
     * クリップボードテキストのパース
     * 都道府県・時差・子時モードはフォーム側で指定する（V1.5では必須拡張しない）
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
        };

        const dateRegex = /(\d{4})[./年\-](\d{1,2})[./月\-](\d{1,2})/;
        const dateMatch = text.match(dateRegex);

        if (dateMatch) {
            result.year = parseInt(dateMatch[1], 10);
            result.month = parseInt(dateMatch[2], 10);
            result.day = parseInt(dateMatch[3], 10);
        } else {
            const jpDateRegex = /(昭和|平成|令和)(\d{1,2}|元)年(\d{1,2})月(\d{1,2})日/;
            const jpMatch = text.match(jpDateRegex);
            if (jpMatch) {
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

        const timeRegex = /(?:(午前|午後)\s*)?(\d{1,2})[:時](\d{1,2})/;
        const timeMatch = text.match(timeRegex);

        if (timeMatch) {
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

        if (text.match(/男性|男|male/i)) {
            result.gender = "男性";
        } else if (text.match(/女性|女|female/i)) {
            result.gender = "女性";
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
