// qml/utils/Telex.js
// Vietnamese Telex helper for QML TextInput components.
const toneKeyIndex = { s: 1, f: 2, r: 3, x: 4, j: 5 };
const toneKeys = Object.keys(toneKeyIndex);

const pairMap = {
    aa: "â",
    aw: "ă",
    dd: "đ",
    ee: "ê",
    oo: "ô",
    ow: "ơ",
    uw: "ư"
};

const toneMap = {
    "a": ["a", "á", "à", "ả", "ã", "ạ"],
    "ă": ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"],
    "â": ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    "e": ["e", "é", "è", "ẻ", "ẽ", "ẹ"],
    "ê": ["ê", "ế", "ề", "ể", "ễ", "ệ"],
    "i": ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    "o": ["o", "ó", "ò", "ỏ", "õ", "ọ"],
    "ô": ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"],
    "ơ": ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    "u": ["u", "ú", "ù", "ủ", "ũ", "ụ"],
    "ư": ["ư", "ứ", "ừ", "ử", "ữ", "ự"],
    "y": ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"],
    "A": ["A", "Á", "À", "Ả", "Ã", "Ạ"],
    "Ă": ["Ă", "Ắ", "Ằ", "Ẳ", "Ẵ", "Ặ"],
    "Â": ["Â", "Ấ", "Ầ", "Ẩ", "Ẫ", "Ậ"],
    "E": ["E", "É", "È", "Ẻ", "Ẽ", "Ẹ"],
    "Ê": ["Ê", "Ế", "Ề", "Ể", "Ễ", "Ệ"],
    "I": ["I", "Í", "Ì", "Ỉ", "Ĩ", "Ị"],
    "O": ["O", "Ó", "Ò", "Ỏ", "Õ", "Ọ"],
    "Ô": ["Ô", "Ố", "Ồ", "Ổ", "Ỗ", "Ộ"],
    "Ơ": ["Ơ", "Ớ", "Ờ", "Ở", "Ỡ", "Ợ"],
    "U": ["U", "Ú", "Ù", "Ủ", "Ũ", "Ụ"],
    "Ư": ["Ư", "Ứ", "Ừ", "Ử", "Ữ", "Ự"],
    "Y": ["Y", "Ý", "Ỳ", "Ỷ", "Ỹ", "Ỵ"]
};

const baseAscii = {
    "a": "a", "ă": "a", "â": "a",
    "e": "e", "ê": "e",
    "i": "i",
    "o": "o", "ô": "o", "ơ": "o",
    "u": "u", "ư": "u",
    "y": "y",
    "A": "A", "Ă": "A", "Â": "A",
    "E": "E", "Ê": "E",
    "I": "I",
    "O": "O", "Ô": "O", "Ơ": "O",
    "U": "U", "Ư": "U",
    "Y": "Y"
};

const charToneInfo = {};
const asciiMap = { "đ": "d", "Đ": "D" };

(function buildMaps() {
    for (const base in toneMap) {
        const forms = toneMap[base];
        for (let i = 0; i < forms.length; ++i) {
            const ch = forms[i];
            charToneInfo[ch] = { base: base, tone: i };
            const ascii = baseAscii[base];
            if (ascii) asciiMap[ch] = ascii;
        }
    }
})();

function isLetter(ch) {
    return ch && ch.toLowerCase() !== ch.toUpperCase();
}

function isUppercase(ch) {
    return ch && ch.toUpperCase() === ch && ch.toLowerCase() !== ch;
}

function combinePair(ch, next) {
    if (!next) return null;
    const key = (ch + next).toLowerCase();
    const rep = pairMap[key];
    if (!rep) return null;
    if (isUppercase(ch)) return rep.toUpperCase();
    return rep;
}

function applyBaseModifiers(word) {
    if (!word) return word;
    let result = "";
    for (let i = 0; i < word.length; ++i) {
        const ch = word[i];
        const next = word[i + 1];
        const replacement = combinePair(ch, next);
        if (replacement) {
            result += replacement;
            i += 1;
        } else {
            result += ch;
        }
    }
    return result.normalize ? result.normalize("NFC") : result;
}

function applyTone(word, toneKey) {
    const idx = toneKeyIndex[toneKey];
    if (!idx) return word;
    const chars = Array.from(word);
    for (let i = chars.length - 1; i >= 0; --i) {
        const info = charToneInfo[chars[i]];
        if (!info) continue;
        const forms = toneMap[info.base];
        if (!forms) continue;
        chars[i] = forms[idx];
        const joined = chars.join("");
        return joined.normalize ? joined.normalize("NFC") : joined;
    }
    return word;
}

function removeTone(word) {
    const chars = Array.from(word);
    for (let i = chars.length - 1; i >= 0; --i) {
        const info = charToneInfo[chars[i]];
        if (!info) continue;
        const forms = toneMap[info.base];
        if (!forms) continue;
        chars[i] = forms[0];
        const joined = chars.join("");
        return joined.normalize ? joined.normalize("NFC") : joined;
    }
    return word;
}

function removeDiacritics(word) {
    const chars = Array.from(word);
    for (let i = chars.length - 1; i >= 0; --i) {
        const ch = chars[i];
        const info = charToneInfo[ch];
        if (info) {
            const ascii = baseAscii[info.base];
            if (ascii) {
                chars[i] = ascii;
                return chars.join("");
            }
        }
        if (asciiMap[ch]) {
            chars[i] = asciiMap[ch];
            return chars.join("");
        }
    }
    return word;
}

function getTone(word) {
    if (!word) return 0;
    for (let i = word.length - 1; i >= 0; i--) {
        const info = charToneInfo[word[i]];
        if (info && info.tone > 0) return info.tone;
    }
    return 0;
}

function processWord(rawWord) {
    if (!rawWord) return rawWord;

    let word = rawWord;
    const lastChar = word[word.length - 1];
    const lastLower = lastChar ? lastChar.toLowerCase() : "";

    // 1. Z key -> Remove everything (tone and modifiers)
    if (lastLower === "z") {
        return removeDiacritics(removeTone(word.slice(0, -1)));
    }

    // 2. Undo/Cycle base modifiers (e.g., â + a -> aa, đ + d -> dd)
    if (word.length >= 2) {
        const prevChar = word[word.length - 2];
        const undoMap = {
            "â": "a", "Â": "a", "ă": "w", "Ă": "w", "ê": "e", "Ê": "e",
            "ô": "o", "Ô": "o", "ơ": "w", "Ơ": "w", "ư": "w", "Ư": "w",
            "đ": "d", "Đ": "d"
        };
        const info = charToneInfo[prevChar];
        if (info) {
            const trigger = undoMap[info.base];
            if (trigger && trigger === lastLower) {
                const ascii = baseAscii[info.base];
                return word.slice(0, -2) + (isUppercase(prevChar) ? ascii.toUpperCase() : ascii) + lastChar;
            }
        }
    }

    // 3. Tone handling (Apply or Undo if same)
    const tkIdx = toneKeyIndex[lastLower];
    if (tkIdx !== undefined) {
        const stem = word.slice(0, -1);
        const currentTone = getTone(stem);
        if (currentTone === tkIdx) {
            // Undo tone: Trần + f -> Trân + f
            return removeTone(stem) + lastChar;
        }
        // Apply tone: Trân + f -> Trần
        const base = removeTone(stem);
        const toned = applyTone(base, lastLower);
        if (toned !== base) return toned;
    }

    // 4. Default: Combine base modifiers (aa -> â, aw -> ă)
    return applyBaseModifiers(word);
}

function findWordStart(text, cursor) {
    let idx = cursor;
    while (idx > 0) {
        const ch = text[idx - 1];
        if (!isLetter(ch)) break;
        idx -= 1;
    }
    return idx;
}

function process(text, cursorPosition) {
    if (!text) return { text: text || "", cursor: cursorPosition || 0 };
    let cursor = cursorPosition;
    if (cursor === undefined || cursor === null) cursor = text.length;

    // If last char is not a letter (e.g., Space), don't process previous word
    if (cursor > 0 && !isLetter(text[cursor - 1])) {
        return { text: text, cursor: cursor };
    }

    const start = findWordStart(text, cursor);
    const word = text.slice(start, cursor);
    if (!word) return { text: text, cursor: cursor };

    const processed = processWord(word);
    if (processed === word) return { text: text, cursor: cursor };

    const newText = text.slice(0, start) + processed + text.slice(cursor);
    const delta = processed.length - word.length;
    return {
        text: newText,
        cursor: cursor + delta
    };
}

function forceProcess(text) {
    if (!text) return text || "";
    const result = process(text, text.length);
    return result.text;
}
