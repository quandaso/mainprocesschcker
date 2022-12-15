require('dotenv').config()
const {sleep, run} = require('./lib');
const config  = require('./config');
const {$get} = require('./httpclient')

let originalProcesses = [];
async function main() {
    originalProcesses = await getMainProcesses();
    console.log('ORIGINAL PROCESS COUNT', originalProcesses.length)
    processCheck();
}

async function telegramSend(chatId, $message) {
    let url = "https://api.telegram.org/bot" + config.TELEGRAM_TOKEN + "/sendMessage?chat_id=" + chatId;
    url = url + "&text=" + encodeURIComponent($message) + '&parse_mode=html';
    await $get(url);
}

let checkedCount = 0;
let notifyCount = 0;
async function processCheck() {
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

        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await telegramSend(config.TELEGRAM_ID, '[' + timestamp + ']\n' + message);
        notifyCount++;
        if (notifyCount >= 10) {
            notifyCount = 0;
            originalProcesses = processes;
        }

    } else {
        process.stdout.write(`OK\n`)
    }

    setTimeout(processCheck, 15000)
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