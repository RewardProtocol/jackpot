// Timer to run main.js at 8pm UTC every day
const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('0 20 * * *', () => {
    console.log('Starting main.js script...');
    exec('node ./main.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`main.js Execution error: ${error}`);
            return;
        }
        console.log(`main.js stdout: ${stdout}`);
        if (stderr) console.error(`main.js stderr: ${stderr}`);
    });
}, {
    scheduled: true,
    timezone: "UTC"
});

console.log('Scheduler has been set up to run main.js at 8 PM UTC daily.');
