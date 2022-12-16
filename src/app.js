require('dotenv').config()
const {sleep, run} = require('./lib');
const config  = require('./config');
const {$get} = require('./httpclient')
const MAX_NOTIFY_COUNT = 1;
let checkedCount = 0;
let notifyCount = 0;

let INTERVAL_CHECK_TIME = parseInt(config.INTERVAL_CHECK_TIME) || 15000;

if (INTERVAL_CHECK_TIME < 15000) {
    INTERVAL_CHECK_TIME = 15000;
    console.warn('env.INTERVAL_CHECK_TIME must >= 15000ms')
}

function timestamp() {
    const d = new Date;
    return config.APP_NAME + '::' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-'+ d.getDate() +
        ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
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
    console.log('config.INTERVAL_CHECK_TIME', config.INTERVAL_CHECK_TIME)
    console.log('````````````````````````````````````````````````')
    await initialProcess(await getMainProcesses());

    processCheck();
}

async function initialProcess(processes) {
    originalProcesses = processes;
    console.log('ORIGINAL PROCESS COUNT', originalProcesses.length);
    await telegramSend('ORIGINAL PROCESS COUNT: ' + originalProcesses.length);
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

async function processCheck() {
    try {
        const  processes = await getMainProcesses();
        checkedCount++;
        process.stdout.write(`[${checkedCount}] Checking Main.exe...`)
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
                    process.stdout.write(m + "\n");
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

            process.stdout.write(`OK\n`)
        }

        setTimeout(processCheck, INTERVAL_CHECK_TIME)
    } catch (err) {
        console.error(err);
        setTimeout(processCheck, INTERVAL_CHECK_TIME)
    }

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