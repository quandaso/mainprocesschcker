const puppeteer = require("puppeteer");
const {spawn} = require('node:child_process');
const KEY_MAP = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
}

const {
    user32FindWindowEx,
    winspoolGetDefaultPrinter,
} = require('win32-api/fun')

async function test() {


// Retrieves the printer name of the default printer for the current user on the local computer

    const child = spawn('notepad.exe');
    const hWnd = await user32FindWindowEx(0, 0, 'Notepad', null);
    console.log(hWnd);
}

async function main() {
    return test();
    const browserURL = 'http://127.0.0.1:9222';
    const browser = await puppeteer.connect({browserURL});

    const page = await browser.newPage();
    await page.goto('https://remotedesktop.google.com/access/session/5c2d90a0-3659-4dda-9c2f-391f74eb09a3');

    await sleep(10000);

    const tab = new TabWrapper(page);
    //await tab.click(300, 400, 5000, 'Bỏ màn xanh mặc định');
    //await tab.click(300, 400, 5000, 'Ấn vào login');

    //await tab.press('quantm9', 3000, 'Nhập mật khẩu');

    //await tab.press('Enter', 2000, 'ENTER');

    await tab.doubleClick(92, 262, 3000, 'Bật process MU');

    await tab.press('r00t', 3000, 'Nhập pass ADMIN');

    await tab.press('Enter', 2000, 'ENTER');
}

class TabWrapper {
    constructor(page) {
        this.page = page;
    }

    async doubleClick(x, y, delay, message = '') {
        console.log('DOUBLE CLICK', x, y, message);
        if (delay  > 0) {
            await sleep(delay);
        }

        await this.page.mouse.click(x, y);
        await this.page.mouse.click(x, y);
    }

    async click(x, y, delay, message = '') {
        if (delay  > 0) {
            await sleep(delay);
        }

        console.log('CLICK', x, y, message);
        await this.page.mouse.click(x, y);
    }

    /**
     *
     * @param {string} input
     * @param {number} delay
     * @param {string} message
     * @returns {Promise<void>}
     */
    async press(input, delay = 1000, message = '') {
        const len = input.length;
        const page = this.page;
        if (delay  > 0) {
            await sleep(delay);
        }

        console.log('PRESS', input, message);

        if (input === 'Enter') {
            await page.keyboard.press('Enter');
            return;
        }

        for (let i = 0; i < len; i++) {
            const c = input.charAt(i).toUpperCase();
            if (KEY_MAP[c]) {
                await page.keyboard.press(KEY_MAP[c]);
            } else {
                await page.keyboard.press('Key' + c);
            }

        }
    }
}

function sleep(ms) {
    console.log(`SLEEP ${ms}`)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    })
}


main().then(r => {
    console.log("DONE", r);
    //process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})