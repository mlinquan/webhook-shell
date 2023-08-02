const _e = require('./i18n.js');

const fs = require('fs');
const { execSync, spawnSync } = require('child_process');
const package = require('./package.json')
const use_mirror = new Date().getTimezoneOffset() === -480;

function checkUpdate(only_check) {
    const mirror = use_mirror ? '--registry=https://registry.npmmirror.com' : '';
    const latest_version_exec = execSync(`npm view webhook-shell version ${mirror}`);
    const latest_version = latest_version_exec.toString().trim();
    if (only_check) {
        console.log(_e('The current installed version is %0, The latest version is %1', package.version, latest_version));
        return;
    }
    if (latest_version !== package.version) {
        const new_package = package;
        new_package.name = 'webhook-shell-';
        fs.writeFileSync('package.json', JSON.stringify(new_package, null, 2));
        try{
            const update_command = ['install', `webhook-shell@${latest_version}`, '-g'];
            if (mirror) {
                update_command.push(mirror);
            }
            const update_res = spawnSync('npm', update_command, { detached: true, stdio: 'inherit' });
            const restart_res = spawnSync('webhook-shell', ['restart'], { detached: true, stdio: 'inherit' });
        } catch(e) {
            console.log(e);
            new_package.name = 'webhook-shell';
            fs.writeFileSync('package.json', JSON.stringify(new_package, null, 2));
        }
    }
}

module.exports = checkUpdate;