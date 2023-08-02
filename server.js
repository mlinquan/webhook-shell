#!/usr/bin/env node

const argv = require('./argv.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root_dir = path.dirname(__filename);
const { execSync, exec } = require('child_process');
const user_dir = path.join(execSync('cd ~ && pwd').toString().trim(), '.webhook-shell-tasks');
const _e = require('./i18n.js');
const package = require('./package.json')
const use_mirror = new Date().getTimezoneOffset() === -480;

const schedule = require('node-schedule');

const job = schedule.scheduleJob('44 44 4 * *', function(){
    checkUpdate();
});

function checkUpdate() {
    const mirror = use_mirror ? ' --registry=https://registry.npmmirror.com' : '';
    const latest_version_exec = execSync(`npm view webhook-shell version${mirror}`);
    const latest_version = latest_version_exec.toString().trim();
    if (latest_version !== package.version) {
        const new_package = package;
        new_package.name = 'webhook-shell-';
        fs.writeFileSync('package.json', JSON.stringify(new_package, null, 2));
        const update_res = execSync(`npm i webhook-shell@${latest_version} -g${use_mirror} && webhook-shell restart`)
        console.log(update_res.toString());
    }
}

const port = argv && argv.port && +argv.port || 8067;
const debug = !!argv.debug;

function getIP() {
    const os = require('os');
    const netInfo = os.networkInterfaces(); //网络信息
    const ipArray = netInfo['eth0'] || netInfo['en0']
    const ipObj = ipArray.find((item) => item.family === 'IPv4');
    const ip = ipObj && ipObj.address;
    return ip;
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
}

const server = http.createServer((req, res) => {
    if (req.method == 'POST') {
        let body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', async () => {
            try {
                body = JSON.parse(body);
            } catch(e) {
                
            }
            body = Object.assign({}, body);
            const taskName = body.taskName;
            if (!taskName || !fs.existsSync(`${user_dir}/${taskName}`)) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.writeHead(200);
                res.write(`{"code": 2, "msg": "${_e('The task name \'%0\' is not exists.', taskName)}"}`)
                return res.end();
            }
            const taskBuf = fs.readFileSync(`${user_dir}/${taskName}`);
            const taskStr = taskBuf.toString();

            let command = taskStr
            Object.keys(body).map((key) => {
                const reg = new RegExp(`\\$\\{${key}\\}`, 'g');
                const val = body[key];
                if (/(\&|\n|\r)/.test(val)) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(200);
                    res.write(`{"code": 3, "msg": "${_e('For safety reasons, parameters are not allowed to include \'&\' and line breaks.')}"}`)
                    return res.end();
                }
                command = command.replace(reg, val);
            });

            console.log('command', command);

            const command_sh = path.join('/tmp', new Date().getTime() + '.sh');

            fs.writeFileSync(command_sh, command);
            let execRes = null
            try{
                execRes = execSync(`sh ${command_sh}`);
                execRes = execRes.toString();
            } catch(e) {
                console.log(e);
                execRes = e && e.message;
            }

            debug && console.log(execRes);

            const rmShTmp = execSync(`rm -fr ${command_sh}`);

            res.setHeader('Content-Type', 'text/html; charset=utf8');
            res.writeHead(200);
            res.write(execRes);
            return res.end();
        });
    } else {
        res.end();
    }
}).listen(port, '0.0.0.0', () => {
    const now = new Date().toLocaleString();
    console.log(`[${now}] ${_e('Webhook-shell is running at %0.', `${getIP()}:${port}`)}`);
});

server.timeout = 15 * 60 * 1000;