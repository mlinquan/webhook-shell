#!/usr/bin/env node

const argv = require('./argv.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');
const _e = require('./i18n.js');
const inquirer = require('inquirer');

const package = require('./package.json')
const checkUpdate = require('./check_update.js');

const action = process.argv && process.argv[2];
const root_dir = path.dirname(__filename);
const user_dir = path.join(execSync('cd ~ && pwd').toString().trim(), '.webhook-shell-tasks');
const log_dir = path.join(execSync('cd ~ && pwd').toString().trim(), '.webhook-shell-log');

const debug = !!argv.debug;

if (!fs.existsSync(user_dir)) {
    fs.mkdirSync(user_dir);
}

if (!fs.existsSync(log_dir)) {
    fs.mkdirSync(log_dir);
}

if (!fs.existsSync(`${log_dir}/nohup.out`)) {
    fs.writeFileSync(`${log_dir}/nohup.out`, '');
}

fs.copyFileSync(`${root_dir}/tasks/test`, `${user_dir}/test`);
fs.copyFileSync(`${root_dir}/tasks/test2`, `${user_dir}/test2`);

function stopAndGetPort(stop, getPort) {
    let old_port = null
    try{
        const ps_res = execSync("ps aux | grep 'webhook-shell/server.js'");
        const ps_str = ps_res.toString();
        const ps_list = ps_str.split("\n");
        for(let i=0;i<ps_list.length;i++) {
            const ps_i = ps_list[i];            
            if (ps_i) {
                const ps_arr = ps_i.split(/\s+/);
                if (ps_arr && ps_arr[10] === 'node' && stop) {
                    const stopRes = execSync(`kill -9 ${ps_arr[1]}`);
                    if (!getPort) {
                        return stopRes.toString();
                    }
                }
                const old_port_info = ps_arr.find(ps => ps.startsWith('--port='))
                if (old_port_info) {
                    old_port = +old_port_info.replace('--port=', '')
                }
            }
        }
    } catch(e) {
        return e;
    }
    if (stop && !old_port) {
        return _e('Webhook-shell not started');
    }
    return old_port;
}

switch(action) {
    case '-v':
    case '-V':
    case 'version':
        console.log(package.version);
        break;
    case 'add':
        inquirer.prompt([
            {
                type: 'input',
                name: 'task_file',
                message: _e('Please enter a task name: ')
            },
            {
                type: 'editor',
                name: 'shell_info',
                message: _e('Enter to enter the editor: ')
            }
        ])
        .then((answers) => {
            let name = answers.task_file && answers.task_file.trim();
            if (name === 'test' || name === 'test2') {
                console.log(_e('The task name \'%0\' is a reserved field. Please use another name.', name));
                process.exit(0);
            }
            if (!/^[a-zA-Z0-9]+$/.test(name)) {
                console.log(_e('The task name \'%0\' is illegal, only English letters and numbers are allowed.', name));
                process.exit(0);
            }
            const task_file_full_path = `${user_dir}/${name}`
            if (fs.existsSync(task_file_full_path)) {
                inquirer.prompt([
                    {
                        type: 'confirm',
                        default: true,
                        name: 'overwrite',
                        message: _e('The task name \'%0\' already exists, do you want to overwrite it?', name)
                    }
                ])
                .then((answers2) => {
                    if (answers2.overwrite) {
                        fs.writeFileSync(task_file_full_path, answers.shell_info)
                    }
                })
                return
            }
            fs.writeFileSync(task_file_full_path, answers.shell_info)
        })
    break;
    case 'ck':
    case 'check':
        checkUpdate(true);
    break;
    case 'update':
        checkUpdate(false);
    break;
    case 'stop':
        const stop_res = stopAndGetPort(true, false);
        console.log(stop_res);
    break;
    case 'start':
    case 'restart':
        if (argv.clean) {
            fs.writeFileSync(`${log_dir}/nohup.out`, '');
        }
        let old_port = stopAndGetPort(true, true);
        const port_info = action === 'restart' && old_port ? `--port=${old_port}` : `--port=${argv.port && +argv.port ? +argv.port : 8067}`
        const ls = spawn('nohup', ['node', `${root_dir}/server.js`, '--title="webhook-shell"', `--debug="${debug}"`, port_info, '&'], { stdio: 'inherit', shell: true, cwd: log_dir });
        ls.on('close', (code) => {
            setTimeout(() => {
                spawn('tail', [`${log_dir}/nohup.out`], { stdio: 'inherit', shell: true });
            }, 100);
        });
    break;
    case 'status':
        let whs_port = stopAndGetPort(false, true);
        if (whs_port) {
            const request = http.get(`http://127.0.0.1:${whs_port}`, (res) => {//res是请求后端给你的数据
                const { statusCode } = res;
                if (statusCode === 200) {
                    const now = new Date().toLocaleString();
                    console.log(`[${now}] ${_e('Webhook-shell is running at %0.', `${whs_port}`)}`);
                } else {
                    console.log('Webhook-shell not started or Webhook-shell process exception');
                }
            });
            request.on('error', (e) => {
                console.log('Webhook-shell not started or Webhook-shell process exception');
            });
        } else {
            console.log(_e('Webhook-shell not started'));
        }
    break;
    case 'ls':
        const tasks = fs.readdirSync(`${user_dir}`);
        tasks.filter(task => !['.DS_Store'].includes(task)).map((task, index) => {
            console.log(`${index + 1}: ${task}`);
        });
    break;
    case 'edit':
        let choices = fs.readdirSync(`${user_dir}`);
        choices = choices.filter(task => !['.DS_Store'].includes(task));
        inquirer.prompt([
            {
                type: 'list',
                name: 'task_name',
                choices,
                message: _e('Please select the task name you want to modify: ')
            }
        ])
        .then((answer1) => {
            const task_file_full_path = `${user_dir}/${answer1.task_name}`
            const task_buffer = fs.readFileSync(task_file_full_path)
            const task_string = task_buffer.toString()
            inquirer.prompt([
                {
                    type: 'editor',
                    name: 'shell_info',
                    default: task_string,
                    message: _e('Enter to enter the editor: ')
                }
            ])
            .then((answer2) => {
                fs.writeFileSync(task_file_full_path, answer2.shell_info)
            })
        })
    break;
    case 'del':
        let delChoices = fs.readdirSync(`${user_dir}`);
        delChoices = delChoices.filter(task => !['.DS_Store'].includes(task));
        inquirer.prompt([
            {
                type: 'list',
                name: 'task_name',
                choices: delChoices,
                message: _e('Please select the task name you want to delete: ')
            }
        ])
        .then((answer1) => {
            const task_file_full_path = `${user_dir}/${answer1.task_name}`
            inquirer.prompt([
                {
                    type: 'confirm',
                    default: false,
                    name: 'confirm',
                    message: _e('Are you sure you want to delete task \'%0\'?', answer1.task_name)
                }
            ])
            .then((answers2) => {
                if (answers2.confirm) {
                    fs.unlinkSync(task_file_full_path)
                    console.log(_e('Task \'%0\' has been successfully deleted', answer1.task_name))
                } else {
                    console.log(_e('Delete canceled'))
                }
            })
        })
    break;
    default:
        console.log('Webhook-shell verions:', package.version);
        const help = fs.readFileSync(`${root_dir}/help.txt`)
        console.log(help.toString());
    break;
}
