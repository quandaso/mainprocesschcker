const {exec} = require('node:child_process');

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }

    return number.toString();
}

function run(command, returnData = false) {
    //console.log('\x1b[36m%s\x1b[0m', '[' + command + ']')
    return new Promise((resolve, reject) => {
        const process = exec(command);

        let stdoutResponse = '', stderrResponse = '';
        process.stdout.on('data', function (data) {
            stdoutResponse += data.toString()
        });

        process.stderr.on('data', function (data) {
            stderrResponse += data.toString()
        });

        process.on('exit', function () {
            resolve({
                stdout: stdoutResponse,
                stderr: stderrResponse,
            })
        });
    })

}


function sleep(time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time)
    }))
}


module.exports = {
     pad, run, sleep
}