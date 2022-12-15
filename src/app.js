require('dotenv').config()
const {sleep, run} = require('./lib');
const config  = require('./config');
const {$get} = require('./httpclient')

async function main() {
    const tasks = await run('tasklist');
    const lines = tasks.split("\n");
    console.log(lines)
    console.log(tasks)
}


main().then(r => {

    console.log("DONE", r);
    //process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})