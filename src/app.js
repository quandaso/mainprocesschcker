require('dotenv').config()
const {sleep, run} = require('./lib');
const config  = require('./config');
const {$get} = require('./httpclient')
const MAX_NOTIFY_COUNT = 1;
let checkedCount = 0;
let notifyCount = 0;

let INTERVAL_CHECK_TIME = parseInt(config.INTERVAL_CHECK_TIME) || 15;
let INTERVAL_REPORT_TIME = parseInt(config.INTERVAL_REPORT_TIME) || 3600;
INTERVAL_CHECK_TIME = getValidRange(INTERVAL_CHECK_TIME, 15, 120, 'INTERVAL_CHECK_TIME');
INTERVAL_REPORT_TIME = getValidRange(INTERVAL_REPORT_TIME, 3600, 7200, 'INTERVAL_REPORT_TIME');


function getValidRange(value, from, to, tag) {
    if (value < from) {
        console.warn(`${tag} must >= ${from}s`);
        value = from;
    } else if (value > to) {
        console.warn(`${tag} must <= ${to}s`);
        value = to;
    }

    return value
}

function info(...args) {
    const _args = ['[' + timestamp() + ']'];
    for (let i = 0; i < args.length; i++) {
        _args.push(args[i]);
    }

    console.log(..._args);
}

function pad10(n) {
    if (n < 10) {
        return '0' + n.toString();
    }

    return n.toString();
}

function timestamp() {
    const d = new Date;
    return config.APP_NAME + '::' + d.getFullYear() + '-' + pad10(d.getMonth() + 1) + '-'+ pad10(d.getDate()) +
        ' ' + pad10(d.getHours()) + ':' + pad10(d.getMinutes()) + ':' + pad10(d.getSeconds())
}

let originalProcesses = [];
async function main() {
    if (process.argv[2] === '--update') {
        const res = await telegramUpdate();
        if (!res.ok) {
            console.error('Error when get updates', res);
            return;
        }

        if (res.result.length === 0) {
            console.log('No updates!');
            return;
        }

        console.log('ChatID=', res.result[0].message.from.id)

        return;
    }
    console.log('````````````````````````````````````````````````')
    console.log('MainProcessChecker v1.0')
    console.log('config.INTERVAL_CHECK_TIME', INTERVAL_CHECK_TIME)
    console.log('config.INTERVAL_REPORT_TIME', INTERVAL_REPORT_TIME)
    console.log('config.SILENT_MODE', config.SILENT_MODE)
    console.log('````````````````````````````````````````````````')
    await initialProcess(await getMainProcesses());

    processCheck();

    setTimeout(intervalReport, 1000*INTERVAL_REPORT_TIME)
}

async function initialProcess(processes) {
    const originalMap = {};
    originalProcesses.forEach(op => {
        originalMap[op.pid] = op;
    });

    let messages = [];
    processes.forEach(p => {
        if (!originalMap.hasOwnProperty(p.pid)) {
            messages.push(`Main ${p.pid} added`);
        }
    })
    originalProcesses = processes;
    info('ORIGINAL PROCESS COUNT', originalProcesses.length);
    await telegramSend('ORIGINAL PROCESS COUNT: ' + processes.length + '\n' + messages.join("\n") );
    notifyCount = 0;
}

async function telegramSend($message, chatId= config.TELEGRAM_ID) {
    $message = '[' + timestamp() + ']\n' + $message;
    let url = "https://api.telegram.org/bot" + config.TELEGRAM_TOKEN + "/sendMessage?chat_id=" + chatId;
    url = url + "&text=" + encodeURIComponent($message) + '&parse_mode=html';
    await $get(url);
}

async function telegramUpdate() {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_TOKEN}/getUpdates`;

    return $get(url);
}

async function intervalReport() {
    try {
        console.log('INTERVAL REPORT: PROCESS COUNT', originalProcesses.length);
        await telegramSend('INTERVAL REPORT: PROCESS COUNT ' +  originalProcesses.length)
    } catch (err) {
        console.error(err);
    }

    setTimeout(intervalReport, 1000*INTERVAL_REPORT_TIME)
}

function print(message) {
    if (!config.SILENT_MODE) {
        process.stdout.write(message);
    }
}

function println(message) {
    if (!config.SILENT_MODE) {
        process.stdout.write(message + "\n");
    }
}

async function processCheck() {
    try {
        const  processes = await getMainProcesses();
        checkedCount++;
        print(`[${checkedCount}] Checking Main.exe...`);

        if (processes.length < originalProcesses.length) {
            const currentProcessMap = {};
            processes.forEach(p => {
                currentProcessMap[p.pid] = p;
            });

            let message = '';
            originalProcesses.forEach(p => {
                if (!currentProcessMap.hasOwnProperty(p.pid)) {
                    const m  = 'Main ' + p.pid + ' disconnected\n';
                    message += m;
                    println(m);
                }
            });

            await telegramSend(message);
            notifyCount++;
            if (notifyCount >= MAX_NOTIFY_COUNT) {
                await initialProcess(processes)
            }

        } else {
            if (processes.length > originalProcesses.length) {
                await initialProcess(processes)
            }

            println('OK');
        }
    } catch (err) {
        info(err);
    }

    setTimeout(processCheck, 1000*INTERVAL_CHECK_TIME);
}

async function getMainProcesses() {
    const tasks = await run('tasklist');
    //const lines = tasks.split("\n");
    //console.log(tasks)
    const lines = tasks.stdout.split("\r\n");
    const muProcess = [];

    lines.forEach(line => {
        line = line.trim();
        if (!line) {
            return;
        }

        if (line.toLowerCase().indexOf('main.exe') > -1) {

            const tmp = line.split(/(\s+)/);
            muProcess.push({
                name: tmp[0],
                pid: tmp[2],
                type: tmp[4],
                session: tmp[6],
                memory: tmp[8]
            });
        }
    });

    return muProcess;
}


main().then(r => {

    //console.log("DONE");
    //process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})