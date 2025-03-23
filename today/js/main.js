// 曜日の配列（日本語表記）
const daysOfWeek = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

// 月の名称
const moonPhaseNameMaster = [
    "新月",
    "二日月",
    "三日月",
    "新月から3日目",
    "新月から4日目",
    "新月から5日目",
    "新月から6日目",
    "上弦の月",
    "上弦の月",
    "満月まで6日前",
    "満月まで5日前",
    "満月まで4日前",
    "満月まで3日前",
    "十三夜月",
    "小望月",
    "満月",
    "十六夜月",
    "立待月",
    "居待月",
    "寝待月",
    "更待月",
    "新月まで8日前",
    "下弦の月",
    "下弦の月",
    "新月まで5日前",
    "新月まで4日前",
    "二十六夜月",
    "新月まで2日前",
    "新月まで1日前",
    "三十日月"
];

// 元号データ（動的対応用）
const eras = [
    { name: "令和", startYear: 2019 },
    { name: "平成", startYear: 1989 },
    { name: "昭和", startYear: 1926 },
    { name: "大正", startYear: 1912 },
    { name: "明治", startYear: 1868 }
];


// CSVファイルのパス
const rokuyouCsvUrl = './data/rokuyou.csv';
const holidayCsvUrl = './data/holiday.csv';
const flowerCsvUrl = './data/flower.csv';
const whatdayCsvUrl = './data/whatday.csv';

$(document).ready(function () {
    
    let now = new Date();

    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");
    if (dateParam && /^\d{8}$/.test(dateParam)) {
        const year = parseInt(dateParam.substring(0, 4), 10);
        const month = parseInt(dateParam.substring(4, 6), 10) - 1;
        const day = parseInt(dateParam.substring(6, 8), 10);
        now = new Date(year, month, day);
    }

    // 初期化処理の呼び出し
    insertCurrentDate(now);
    updateCountdown(now);
    insertDayOfWeek(now);

    // 月齢を計算して表示
    const startMoonAge = calculateStartMoonAge(now);
    const endMoonAge = calculateEndMoonAge(now);
    console.log(startMoonAge, endMoonAge)
    const moonIndex = getMoonPhaseIndex(startMoonAge, endMoonAge);
    const moonPhase = moonPhaseNameMaster[moonIndex];
    const imageName = getMoonImageName(moonIndex);
    $('#moonPhase').text(moonPhase || '-');
    $('#moonImage').attr('src', `./img/moon/${imageName}`);

    loadCSV(rokuyouCsvUrl, function (csvData) {
        const rokuyou = getRokuyou(csvData, now);
        $('#rokuyou').text(rokuyou || '-'); // 祝日がない場合は「-」を表示
    });
    loadCSV(holidayCsvUrl, function (csvData) {
        const holidayName = getHolidayName(csvData, now);
        $('#holiday').text(holidayName || '-'); // 祝日がない場合は「-」を表示
    });
    loadCSV(flowerCsvUrl, function (csvData) {
        const flowerData = getFlowerData(csvData, now);
        // flowerDataが存在するか確認
        if (flowerData) {
            $('#flower').text(flowerData.name || '-'); // 花の名前を表示
            $('#languageofflowers').text(flowerData.language || '-'); // 花言葉を表示
        } else {
            $('#flower').text('-'); // flowerDataがundefinedの場合は「-」を表示
            $('#languageofflowers').text('-'); 
        }
    });
    loadCSV(whatdayCsvUrl, function (csvData) {
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const dayIndex = now.getDay();
        
        const specialDays = getSpecialDays(csvData, now);

        // 配列をループして<li>を生成し<ul>に追加
        specialDays.forEach(function (day) {
            $('#whatday').append(`<li>${day}</li>`);
        });

        const rawBody = `今日は${year}年${month}月${day}日の${daysOfWeek[dayIndex]}『${specialDays[0]}』です。

https://us-naishin.com/today/`;

        const lineBody = encodeURIComponent(rawBody);
        const xBody = encodeURIComponent(rawBody + ' #今日を知るサイトTODAY');
        const facebookLink = encodeURIComponent('https://us-naishin.com/today/');

        $('#facebookLink').attr('href', `https://www.facebook.com/sharer/sharer.php?u=${facebookLink}`);
        $('#xLink').attr('href', `https://twitter.com/intent/tweet?text=${xBody}`);
        $('#lineLink').attr('href', `https://line.me/R/msg/text/?${lineBody}`);
    });
});

// 和暦を計算する関数
function getJapaneseYear(year) {
    for (const era of eras) {
        if (year >= era.startYear) {
            return {
                era: era.name,
                year: year - era.startYear + 1
            };
        }
    }
    return { era: "不明", year: year }; // 明治以前の対応
}

// 現在の日付を挿入する関数
function insertCurrentDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const japaneseDate = getJapaneseYear(year);

    $("#westernyear").text(year);         // 西暦
    $("#nextyear").text(year + 1);         // 西暦
    $(".month").text(month);             // 月
    $(".day").text(day);                 // 日
    $("#japaneseYear").text(japaneseDate.year); // 和暦年
    $("#era").text(japaneseDate.era);    // 元号
}

// 次の年の1月1日までのカウントダウンを更新
function updateCountdown(date) {
    const targetDate = new Date(date.getFullYear() + 1, 0, 1); // 次の年の1月1日
    const daysRemaining = Math.ceil((targetDate - date) / (1000 * 60 * 60 * 24));

    $('#daysRemaining').text(daysRemaining);
}

// 曜日を挿入する関数
function insertDayOfWeek(date) {
    const dayIndex = date.getDay();
    $("#dayofweek").text(daysOfWeek[dayIndex]);
}

// CSVファイルを読み込む関数
function loadCSV(url, callback) {
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'text',
        success: callback,
        error: function (xhr, status, error) {
            console.error('CSV読み込みエラー:', status, error);
        }
    });
}

// 今日の日付から六曜を取得する関数
function getRokuyou(csvData, date) {
    const today = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    const rows = csvData.split('\n').slice(1); // ヘッダーを除外

    for (const row of rows) {
        const [csvDate, rokuyou] = row.split(',');
        if (csvDate === today) {
            return rokuyou.trim(); // 日付が一致した場合の六曜を返す
        }
    }
    return null; // 該当する六曜がない場合
}

// 今日の日付から祝日を取得する関数
function getHolidayName(csvData, date) {
    const today = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    const rows = csvData.split('\n').slice(1); // ヘッダーを除外

    for (const row of rows) {
        const [csvDate, holidayName] = row.split(',');
        if (csvDate === today) {
            return holidayName.trim(); // 日付が一致した場合の祝日を返す
        }
    }
    return null; // 該当する祝日がない場合
}

// 今日の日付から花のデータを取得する関数
function getFlowerData(csvData, date) {
    const today = `${date.getMonth() + 1}/${date.getDate()}`;
    const rows = csvData.split('\n').slice(1); // ヘッダーを除外

    for (const row of rows) {
        const [csvDate, flowerName, flowerLanguage] = row.split(','); // CSVの各列を分割
        if (csvDate === today) {
            return {
                name: flowerName.trim(),         // 花の名前
                language: flowerLanguage.trim()  // 花言葉
            };
        }
    }
    return null; // 該当するデータがない場合
}

// 今日の日付から記念日を取得する関数
function getSpecialDays(csvData, date) {
    const today = `${date.getMonth() + 1}/${date.getDate()}`; // 今日の日付を生成
    const rows = csvData.split('\n').slice(1); // ヘッダーを除外

    for (const row of rows) {
        // ダブルクオーテーションで囲まれたカンマを考慮して分割
        const matches = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (matches) {
            const csvDate = matches[0].replace(/^"|"$/g, ''); // 最初の列 (日付)
            const specialDays = matches[1] ? matches[1].replace(/^"|"$/g, '') : ''; // 記念日（カンマを含む可能性あり）
            
            if (csvDate === today) {
                return specialDays.split('|').map(day => day.trim()); // 記念日を配列として返す
            }
        }
    }
    return []; // 該当するデータがない場合は空の配列を返す
}

function calculateStartMoonAge(date) {
    // 日付が無効な場合は終了
    if (isNaN(date.getTime())) return;

    // 0時00分に変更
    date.setHours(0, 0, 0, 0);

    return calculateMoonAge(date);
}

function calculateEndMoonAge(date) {
    // 日付が無効な場合は終了
    if (isNaN(date.getTime())) return;

    // 2時23分に変更
    date.setHours(23, 59, 59, 999);

    return calculateMoonAge(date);
}

// 月齢を計算する関数
function calculateMoonAge(date) {
    // 日付が無効な場合は終了
    if (isNaN(date.getTime())) return null;

    // 定数の定義
    const MILLISECONDS_PER_DAY = 86400000; // 1日あたりのミリ秒数
    const BASE_DATE_ADJUSTMENT = 6.475;    // 基準日調整値
    const AVERAGE_LUNAR_CYCLE = 29.530588853; // 平均月の周期（日）
    const START_DATE = new Date('2000-01-01T12:00:00Z').getTime(); // 基準日時
    const SECONDS_PER_YEAR = 31557600000; // 1年の秒数
    const LUNAR_CYCLE_CORRECTION_FACTOR = 0.000000002162; // 月の周期に対する補正係数

    // 経過日数を計算
    const daysSinceReference = date.getTime() / MILLISECONDS_PER_DAY - BASE_DATE_ADJUSTMENT;

    // 平均朔望月を計算
    const meanLunarCycle = AVERAGE_LUNAR_CYCLE + LUNAR_CYCLE_CORRECTION_FACTOR * ((date.getTime() - START_DATE) / SECONDS_PER_YEAR);

    // 月齢を計算
    const moonAge = daysSinceReference > 0
        ? daysSinceReference % meanLunarCycle
        : (meanLunarCycle + (daysSinceReference % meanLunarCycle)) % meanLunarCycle;

    return moonAge;
}


// 月齢から月の日本語名を取得する関数
function getMoonPhaseIndex(startMoonAge, endMoonAge) {
    if (startMoonAge <= 1 && 1 <= endMoonAge) {
        return 1;
    } else if (startMoonAge <= 2 && 2 <= endMoonAge) {
        return 2;
    } else if (startMoonAge <= 3 && 3 <= endMoonAge) {
        return 3;
    } else if (startMoonAge <= 4 && 4 <= endMoonAge) {
        return 4;
    } else if (startMoonAge <= 5 && 5 <= endMoonAge) {
        return 5;
    } else if (startMoonAge <= 6 && 6 <= endMoonAge) {
        return 6;
    } else if (startMoonAge <= 7 && 7 <= endMoonAge) {
        return 7;
    } else if (startMoonAge <= 8 && 8 <= endMoonAge) {
        return 8;
    } else if (startMoonAge <= 9 && 9 <= endMoonAge) {
        return 9;
    } else if (startMoonAge <= 10 && 10 <= endMoonAge) {
        return 10;
    } else if (startMoonAge <= 11 && 11 <= endMoonAge) {
        return 11;
    } else if (startMoonAge <= 12 && 12 <= endMoonAge) {
        return 12;
    } else if (startMoonAge <= 13 && 13 <= endMoonAge) {
        return 13;
    } else if (startMoonAge <= 14 && 14 <= endMoonAge) {
        return 14;
    } else if (startMoonAge <= 15 && 15 <= endMoonAge) {
        return 15;
    } else if (startMoonAge <= 16 && 16 <= endMoonAge) {
        return 16;
    } else if (startMoonAge <= 17 && 17 <= endMoonAge) {
        return 17;
    } else if (startMoonAge <= 18 && 18 <= endMoonAge) {
        return 18;
    } else if (startMoonAge <= 19 && 19 <= endMoonAge) {
        return 19;
    } else if (startMoonAge <= 20 && 20 <= endMoonAge) {
        return 20;
    } else if (startMoonAge <= 21 && 21 <= endMoonAge) {
        return 21;
    } else if (startMoonAge <= 22 && 22 <= endMoonAge) {
        return 22;
    } else if (startMoonAge <= 23 && 23 <= endMoonAge) {
        return 23;
    } else if (startMoonAge <= 24 && 24 <= endMoonAge) {
        return 24;
    } else if (startMoonAge <= 25 && 25 <= endMoonAge) {
        return 25;
    } else if (startMoonAge <= 26 && 26 <= endMoonAge) {
        return 26;
    } else if (startMoonAge <= 27 && 27 <= endMoonAge) {
        return 27;
    } else if (startMoonAge <= 28 && 28 <= endMoonAge) {
        return 28;
    } else if (startMoonAge <= 29 && 29 <= endMoonAge) {
        return 29;
    } else {
        return 0; //該当しない場合新月た
    }
    
}

// 月の画像名を取得
function getMoonImageName(moonAge) {
    const index = Math.floor(moonAge);
    return `${index}.png`;
}