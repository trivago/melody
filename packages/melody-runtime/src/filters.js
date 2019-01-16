/**
 * Copyright 2017 trivago N.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { round as lRound, ceil, floor, isString } from 'lodash';

export function batch(items: Array, groupSize: Number, missing = '') {
    const batchedResult = [],
        len = items.length;
    for (let i = 0; i < len; i += groupSize) {
        const batch = [];
        for (let j = 0; j < groupSize; j++) {
            batch[batch.length] = i + j < len ? items[i + j] : missing;
        }
        batchedResult[batchedResult.length] = batch;
    }
    return batchedResult;
}

export function attrs(attrMap: Object) {
    const attrArray = [];
    for (const attr in attrMap) {
        if (!attrMap.hasOwnProperty(attr)) {
            continue;
        }

        const value = attrMap[attr];
        attrArray.push(
            attr,
            value === false || value === null || value === 0 || value === ''
                ? undefined
                : value
        );
    }
    return attrArray;
}

export function styles(declarationsMap) {
    let declarations = '';
    const keys = Object.keys(declarationsMap);
    for (let i = 0; i < keys.length; i++) {
        const value = declarationsMap[keys[i]];
        if (
            (typeof value === 'string' && value !== '') ||
            (typeof value === 'number' && !isNaN(value))
        ) {
            declarations += `${keys[i]}:${value};`;
        }
    }
    return declarations;
}

export function classes(classMap: Object) {
    const classArray = [];
    for (const cla in classMap) {
        if (!classMap.hasOwnProperty(cla)) {
            continue;
        }
        if (cla === 'base') {
            classArray.push(classMap[cla]);
        } else if (classMap[cla]) {
            classArray.push(cla);
        }
    }
    return classArray.join(' ');
}

export function merge(initial, additions) {
    if (Array.isArray(initial) && Array.isArray(additions)) {
        return [...initial, ...additions];
    }
    return Object.assign({}, initial, additions);
}

export function replace(input, replacements) {
    let result = input;
    for (const search in replacements) {
        if (replacements.hasOwnProperty(search)) {
            result = result.replace(search, replacements[search]);
        }
    }
    return result;
}

export function reverse(iterable) {
    if (Array.isArray(iterable)) {
        const resArray = [];
        for (let i = iterable.length - 1; i >= 0; i--) {
            resArray[resArray.length] = iterable[i];
        }
        return resArray;
    } else if (isString(iterable)) {
        let resString = '';
        for (let i = iterable.length - 1; i >= 0; i--) {
            resString += iterable[i];
        }
        return resString;
    } else {
        // JavaScript isn't PHP. The order in which properties are added to
        // an object may or may not be relevant when iterating over the values in
        // an object.
        // Thus, we don't support that kind of usage.
        return iterable;
    }
}

export function round(num: Number, precision: Number = 0, method = 'common') {
    switch (method) {
        case 'ceil':
            return ceil(num, precision);
        case 'floor':
            return floor(num, precision);
        case 'common':
        default:
            return lRound(num, precision);
    }
}

export function striptags(input) {
    //  discuss at: http://phpjs.org/functions/strip_tags/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Luke Godfrey
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //    input by: Pul
    //    input by: Alex
    //    input by: Marc Palau
    //    input by: Brett Zamir (http://brett-zamir.me)
    //    input by: Bobby Drake
    //    input by: Evertjan Garretsen
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Onno Marsman
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Eric Nagel
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Tomasz Wesolowski
    //  revised by: Rafał Kukawski (http://blog.kukawski.pl/)
    //   example 1: strip_tags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>');
    //   returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
    //   example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
    //   returns 2: '<p>Kevin van Zonneveld</p>'
    //   example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
    //   returns 3: "<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>"
    //   example 4: strip_tags('1 < 5 5 > 1');
    //   returns 4: '1 < 5 5 > 1'
    //   example 5: strip_tags('1 <br/> 1');
    //   returns 5: '1  1'
    //   example 6: strip_tags('1 <br/> 1', '<br>');
    //   returns 6: '1 <br/> 1'
    //   example 7: strip_tags('1 <br/> 1', '<br><br/>');
    //   returns 7: '1 <br/> 1'
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, '');
}

function toFixedFix(n, prec) {
    var k = Math.pow(10, prec);
    return '' + (Math.round(n * k) / k).toFixed(prec);
}

/**
 * Filters: number_format
 * @param number
 * @param decimals
 * @param dec_point
 * @param thousands_sep
 * @returns {string}
 */
export function number_format(numberParam, decimals, dec_point, thousands_sep) {
    //  discuss at: http://phpjs.org/functions/number_format/
    // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: davook
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Theriault
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Michael White (http://getsprink.com)
    // bugfixed by: Benjamin Lupton
    // bugfixed by: Allan Jensen (http://www.winternet.no)
    // bugfixed by: Howard Yeend
    // bugfixed by: Diogo Resende
    // bugfixed by: Rival
    // bugfixed by: Brett Zamir (http://brett-zamir.me)
    //  revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    //  revised by: Luke Smith (http://lucassmith.name)
    //    input by: Kheang Hok Chin (http://www.distantia.ca/)
    //    input by: Jay Klehr
    //    input by: Amir Habibi (http://www.residence-mixte.com/)
    //    input by: Amirouche

    const number = (numberParam + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep,
        dec = typeof dec_point === 'undefined' ? '.' : dec_point,
        s;
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

export function format(...a) {
    //  discuss at: http://phpjs.org/functions/sprintf/
    // original by: Ash Searle (http://hexmen.com/blog/)
    // improved by: Michael White (http://getsprink.com)
    // improved by: Jack
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Dj
    // improved by: Allidylls
    //    input by: Paulo Freitas
    //    input by: Brett Zamir (http://brett-zamir.me)
    //   example 1: sprintf("%01.2f", 123.1);
    //   returns 1: 123.10
    //   example 2: sprintf("[%10s]", 'monkey');
    //   returns 2: '[    monkey]'
    //   example 3: sprintf("[%'#10s]", 'monkey');
    //   returns 3: '[####monkey]'
    //   example 4: sprintf("%d", 123456789012345);
    //   returns 4: '123456789012345'
    //   example 5: sprintf('%-03s', 'E');
    //   returns 5: 'E00'

    var regex = /%%|%(\d+\$)?([\-+\'#0 ]*)(\*\d+\$|\*|\d+)?(?:\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
    var i = 0;
    var format = a[i++];

    // pad()
    var pad = function(str, len, chr = ' ', leftJustify) {
        var padding =
            str.length >= len
                ? ''
                : new Array((1 + len - str.length) >>> 0).join(chr);
        return leftJustify ? str + padding : padding + str;
    };

    // justify()
    var justify = function(
        value,
        prefix,
        leftJustify,
        minWidth,
        zeroPad,
        customPadChar
    ) {
        var diff = minWidth - value.length;
        if (diff > 0) {
            if (leftJustify || !zeroPad) {
                return pad(value, minWidth, customPadChar, leftJustify);
            } else {
                return (
                    value.slice(0, prefix.length) +
                    pad('', diff, '0', true) +
                    value.slice(prefix.length)
                );
            }
        }
        return value;
    };

    // formatBaseX()
    var formatBaseX = function(
        n,
        base,
        prefixParam,
        leftJustify,
        minWidth,
        precision,
        zeroPad
    ) {
        // Note: casts negative numbers to positive ones
        var number = n >>> 0;
        const prefix =
            (prefixParam &&
                number &&
                {
                    '2': '0b',
                    '8': '0',
                    '16': '0x',
                }[base]) ||
            '';
        const value =
            prefix + pad(number.toString(base), precision || 0, '0', false);
        return justify(value, prefix, leftJustify, minWidth, zeroPad);
    };

    // formatString()
    var formatString = function(
        valueParam,
        leftJustify,
        minWidth,
        precision,
        zeroPad,
        customPadChar
    ) {
        let value = valueParam;
        if (precision !== null && precision !== undefined) {
            value = value.slice(0, precision);
        }
        return justify(
            value,
            '',
            leftJustify,
            minWidth,
            zeroPad,
            customPadChar
        );
    };

    // doFormat()
    var doFormat = function(
        substring,
        valueIndex,
        flags,
        minWidthParam,
        precisionParam,
        type
    ) {
        var number, prefix, method, textTransform, value;

        if (substring === '%%') {
            return '%';
        }

        // parse flags
        var leftJustify = false;
        var positivePrefix = '';
        var zeroPad = false;
        var prefixBaseX = false;
        var customPadChar = ' ';
        var flagsl = flags.length;
        var j;
        for (j = 0; flags && j < flagsl; j++) {
            switch (flags.charAt(j)) {
                case ' ':
                    positivePrefix = ' ';
                    break;
                case '+':
                    positivePrefix = '+';
                    break;
                case '-':
                    leftJustify = true;
                    break;
                case "'":
                    customPadChar = flags.charAt(j + 1);
                    break;
                case '0':
                    zeroPad = true;
                    customPadChar = '0';
                    break;
                case '#':
                    prefixBaseX = true;
                    break;
            }
        }

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values
        let minWidth = minWidthParam;
        if (!minWidth) {
            minWidth = 0;
        } else if (minWidth === '*') {
            minWidth = +a[i++];
        } else if (minWidth.charAt(0) === '*') {
            minWidth = +a[minWidth.slice(1, -1)];
        } else {
            minWidth = +minWidth;
        }

        // Note: undocumented perl feature:
        if (minWidth < 0) {
            minWidth = -minWidth;
            leftJustify = true;
        }

        if (!isFinite(minWidth)) {
            throw new Error('sprintf: (minimum-)width must be finite');
        }

        let precision = precisionParam;
        if (!precision) {
            precision =
                'fFeE'.indexOf(type) > -1 ? 6 : type === 'd' ? 0 : undefined;
        } else if (precision === '*') {
            precision = +a[i++];
        } else if (precision.charAt(0) === '*') {
            precision = +a[precision.slice(1, -1)];
        } else {
            precision = +precision;
        }

        // grab value using valueIndex if required?
        value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

        switch (type) {
            case 's':
                return formatString(
                    String(value),
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad,
                    customPadChar
                );
            case 'c':
                return formatString(
                    String.fromCharCode(+value),
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                );
            case 'b':
                return formatBaseX(
                    value,
                    2,
                    prefixBaseX,
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                );
            case 'o':
                return formatBaseX(
                    value,
                    8,
                    prefixBaseX,
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                );
            case 'x':
                return formatBaseX(
                    value,
                    16,
                    prefixBaseX,
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                );
            case 'X':
                return formatBaseX(
                    value,
                    16,
                    prefixBaseX,
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                ).toUpperCase();
            case 'u':
                return formatBaseX(
                    value,
                    10,
                    prefixBaseX,
                    leftJustify,
                    minWidth,
                    precision,
                    zeroPad
                );
            case 'i':
            case 'd':
                number = +value || 0;
                // Plain Math.round doesn't just truncate
                number = Math.round(number - (number % 1));
                prefix = number < 0 ? '-' : positivePrefix;
                value =
                    prefix +
                    pad(String(Math.abs(number)), precision, '0', false);
                return justify(value, prefix, leftJustify, minWidth, zeroPad);
            case 'e':
            case 'E':
            case 'f': // Should handle locales (as per setlocale)
            case 'F':
            case 'g':
            case 'G':
                number = +value;
                prefix = number < 0 ? '-' : positivePrefix;
                method = ['toExponential', 'toFixed', 'toPrecision'][
                    'efg'.indexOf(type.toLowerCase())
                ];
                textTransform = ['toString', 'toUpperCase'][
                    'eEfFgG'.indexOf(type) % 2
                ];
                value = prefix + Math.abs(number)[method](precision);
                return justify(value, prefix, leftJustify, minWidth, zeroPad)[
                    textTransform
                ]();
            default:
                return substring;
        }
    };

    return format.replace(regex, doFormat);
}

export function title(input) {
    let res = '',
        ucNext = true;
    for (let i = 0, len = input.length; i < len; i++) {
        const c = input[i];
        if (c === '\n' || c === ' ' || c === '\t') {
            ucNext = true;
            res += c;
        } else if (ucNext) {
            res += c.toUpperCase();
            ucNext = false;
        } else {
            res += c;
        }
    }
    return res;
}

export function url_encode(input) {
    if (isString(input)) {
        return encodeURIComponent(input);
    }
    const parts = [];
    for (const key in input) {
        if (input.hasOwnProperty(key)) {
            parts.push(
                encodeURIComponent(key) + '=' + encodeURIComponent(input[key])
            );
        }
    }
    return parts.join('&');
}

export function strtotime(input, now) {
    //  discuss at: http://phpjs.org/functions/strtotime/
    //     version: 1109.2016
    // original by: Caio Ariede (http://caioariede.com)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Caio Ariede (http://caioariede.com)
    // improved by: A. Matías Quezada (http://amatiasq.com)
    // improved by: preuter
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Mirko Faber
    //    input by: David
    // bugfixed by: Wagner B. Soares
    // bugfixed by: Artur Tchernychev
    // bugfixed by: Stephan Bösch-Plepelits (http://github.com/plepe)
    //        note: Examples all have a fixed timestamp to prevent tests to fail because of variable time(zones)
    //   example 1: strtotime('+1 day', 1129633200);
    //   returns 1: 1129719600
    //   example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200);
    //   returns 2: 1130425202
    //   example 3: strtotime('last month', 1129633200);
    //   returns 3: 1127041200
    //   example 4: strtotime('2009-05-04 08:30:00 GMT');
    //   returns 4: 1241425800
    //   example 5: strtotime('2009-05-04 08:30:00+00');
    //   returns 5: 1241425800
    //   example 6: strtotime('2009-05-04 08:30:00+02:00');
    //   returns 6: 1241418600
    //   example 7: strtotime('2009-05-04T08:30:00Z');
    //   returns 7: 1241425800

    var parsed,
        match,
        today,
        year,
        date,
        days,
        ranges,
        len,
        times,
        regex,
        i,
        fail = false;

    if (!input) {
        return fail;
    }

    // Unecessary spaces
    const text = input
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/[\t\r\n]/g, '')
        .toLowerCase();

    // in contrast to php, js Date.parse function interprets:
    // dates given as yyyy-mm-dd as in timezone: UTC,
    // dates with "." or "-" as MDY instead of DMY
    // dates with two-digit years differently
    // etc...etc...
    // ...therefore we manually parse lots of common date formats
    match = text.match(
        /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/
    );

    if (match && match[2] === match[4]) {
        if (match[1] > 1901) {
            switch (match[2]) {
                case '-': {
                    // YYYY-M-D
                    if (match[3] > 12 || match[5] > 31) {
                        return fail;
                    }

                    return (
                        new Date(
                            match[1],
                            parseInt(match[3], 10) - 1,
                            match[5],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
                case '.': {
                    // YYYY.M.D is not parsed by strtotime()
                    return fail;
                }
                case '/': {
                    // YYYY/M/D
                    if (match[3] > 12 || match[5] > 31) {
                        return fail;
                    }

                    return (
                        new Date(
                            match[1],
                            parseInt(match[3], 10) - 1,
                            match[5],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
            }
        } else if (match[5] > 1901) {
            switch (match[2]) {
                case '-': {
                    // D-M-YYYY
                    if (match[3] > 12 || match[1] > 31) {
                        return fail;
                    }

                    return (
                        new Date(
                            match[5],
                            parseInt(match[3], 10) - 1,
                            match[1],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
                case '.': {
                    // D.M.YYYY
                    if (match[3] > 12 || match[1] > 31) {
                        return fail;
                    }

                    return (
                        new Date(
                            match[5],
                            parseInt(match[3], 10) - 1,
                            match[1],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
                case '/': {
                    // M/D/YYYY
                    if (match[1] > 12 || match[3] > 31) {
                        return fail;
                    }

                    return (
                        new Date(
                            match[5],
                            parseInt(match[1], 10) - 1,
                            match[3],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
            }
        } else {
            switch (match[2]) {
                case '-': {
                    // YY-M-D
                    if (
                        match[3] > 12 ||
                        match[5] > 31 ||
                        (match[1] < 70 && match[1] > 38)
                    ) {
                        return fail;
                    }

                    year =
                        match[1] >= 0 && match[1] <= 38
                            ? +match[1] + 2000
                            : match[1];
                    return (
                        new Date(
                            year,
                            parseInt(match[3], 10) - 1,
                            match[5],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
                case '.': {
                    // D.M.YY or H.MM.SS
                    if (match[5] >= 70) {
                        // D.M.YY
                        if (match[3] > 12 || match[1] > 31) {
                            return fail;
                        }

                        return (
                            new Date(
                                match[5],
                                parseInt(match[3], 10) - 1,
                                match[1],
                                match[6] || 0,
                                match[7] || 0,
                                match[8] || 0,
                                match[9] || 0
                            ) / 1000
                        );
                    }
                    if (match[5] < 60 && !match[6]) {
                        // H.MM.SS
                        if (match[1] > 23 || match[3] > 59) {
                            return fail;
                        }

                        today = new Date();
                        return (
                            new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                                match[1] || 0,
                                match[3] || 0,
                                match[5] || 0,
                                match[9] || 0
                            ) / 1000
                        );
                    }

                    // invalid format, cannot be parsed
                    return fail;
                }
                case '/': {
                    // M/D/YY
                    if (
                        match[1] > 12 ||
                        match[3] > 31 ||
                        (match[5] < 70 && match[5] > 38)
                    ) {
                        return fail;
                    }

                    year =
                        match[5] >= 0 && match[5] <= 38
                            ? +match[5] + 2000
                            : match[5];
                    return (
                        new Date(
                            year,
                            parseInt(match[1], 10) - 1,
                            match[3],
                            match[6] || 0,
                            match[7] || 0,
                            match[8] || 0,
                            match[9] || 0
                        ) / 1000
                    );
                }
                case ':': {
                    // HH:MM:SS
                    if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
                        return fail;
                    }

                    today = new Date();
                    return (
                        new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate(),
                            match[1] || 0,
                            match[3] || 0,
                            match[5] || 0
                        ) / 1000
                    );
                }
            }
        }
    }

    // other formats and "now" should be parsed by Date.parse()
    if (text === 'now') {
        return now === null || isNaN(now)
            ? (new Date().getTime() / 1000) | 0
            : now | 0;
    }
    if (!isNaN((parsed = Date.parse(text)))) {
        return (parsed / 1000) | 0;
    }
    // Browsers != Chrome have problems parsing ISO 8601 date strings, as they do
    // not accept lower case characters, space, or shortened time zones.
    // Therefore, fix these problems and try again.
    // Examples:
    //   2015-04-15 20:33:59+02
    //   2015-04-15 20:33:59z
    //   2015-04-15t20:33:59+02:00
    match = text.match(
        /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ t]([0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?)([\+-][0-9]{2}(:[0-9]{2})?|z)/
    );
    if (match) {
        // fix time zone information
        if (match[4] == 'z') {
            match[4] = 'Z';
        } else if (match[4].match(/^([\+-][0-9]{2})$/)) {
            match[4] = match[4] + ':00';
        }

        if (
            !isNaN((parsed = Date.parse(match[1] + 'T' + match[2] + match[4])))
        ) {
            return (parsed / 1000) | 0;
        }
    }

    date = now ? new Date(now * 1000) : new Date();
    days = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };
    ranges = {
        yea: 'FullYear',
        mon: 'Month',
        day: 'Date',
        hou: 'Hours',
        min: 'Minutes',
        sec: 'Seconds',
    };

    function lastNext(type, range, modifier) {
        let diff;
        const day = days[range];

        if (typeof day !== 'undefined') {
            diff = day - date.getDay();

            if (diff === 0) {
                diff = 7 * modifier;
            } else if (diff > 0 && type === 'last') {
                diff -= 7;
            } else if (diff < 0 && type === 'next') {
                diff += 7;
            }

            date.setDate(date.getDate() + diff);
        }
    }

    function process(val) {
        var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
            type = splt[0],
            range = splt[1].substring(0, 3),
            typeIsNumber = /\d+/.test(type),
            ago = splt[2] === 'ago',
            num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);

        if (typeIsNumber) {
            num *= parseInt(type, 10);
        }

        if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
            return date['set' + ranges[range]](
                date['get' + ranges[range]]() + num
            );
        }

        if (range === 'wee') {
            return date.setDate(date.getDate() + num * 7);
        }

        if (type === 'next' || type === 'last') {
            lastNext(type, range, num);
        } else if (!typeIsNumber) {
            return false;
        }

        return true;
    }

    times =
        '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
        '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
        '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
    regex =
        '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';

    match = text.match(new RegExp(regex, 'gi'));
    if (!match) {
        return fail;
    }

    for (i = 0, len = match.length; i < len; i++) {
        if (!process(match[i])) {
            return fail;
        }
    }

    // ECMAScript 5 only
    // if (!match.every(process))
    //    return false;

    return date.getTime() / 1000;
}

export function trim(str, charList, side = 'both') {
    if (charList === undefined && side === 'both') {
        // Use String.prototype.trim() for efficiency
        return String(str).trim();
    }

    if (side !== 'both' && side !== 'left' && side !== 'right') {
        throw new Error(
            'Filter "trim". Invalid value ' +
                side +
                ' for parameter "side". Valid values are "both", "left", "right".'
        );
    }

    const strLen = str.length;

    let trimStart = 0;
    if (side === 'both' || side === 'left') {
        while (trimStart < strLen && charList.indexOf(str[trimStart]) !== -1) {
            trimStart++;
        }
    }

    let trimEnd = strLen;
    if (side === 'both' || side === 'right') {
        while (trimEnd > 0 && charList.indexOf(str[trimEnd - 1]) !== -1) {
            trimEnd--;
        }
    }

    return str.substr(trimStart, trimEnd - trimStart);
}
