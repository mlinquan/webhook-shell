# webhook-shell
[![npm version](https://badge.fury.io/js/webhook-shell.svg)](https://badge.fury.io/js/webhook-shell)
[![Gzip Size](http://img.badgesize.io/https://unpkg.com/webhook-shell@latest/dist/webhook-shell.umd.min.js?compression=gzip&style=flat-square)](https://unpkg.com/webhook-shell)
[![Monthly Downloads](https://img.shields.io/npm/dm/webhook-shell.svg)](https://www.npmjs.com/package/webhook-shell)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![License: Anti 996](https://img.shields.io/badge/License-Anti%20996-yellow.svg)](https://github.com/kattgu7/Anti-996-License/blob/master/LICENSE)

## Install
```
npm install -g webhook-shell
# or
pnpm install -g webhook-shell
# or
cnpm install -g webhook-shell
# or
yarn global add webhook-shell
```

## Usage
```
# help
webhook-shell

# add new task
webhook-shell add

# edit a task
webhook-shell edit

# list task list
webhook-shell ls

# start server
webhook-shell start
webhook-shell start --port=3000 # default port is 8067

# restart server
webhook-shell restart # inherit the previously set port
webhook-shell restart --port=3000 # custom port restart

# view server status
webhook-shell status

# stop server
webhook-shell stop
```

## Nginx proxy
```
server {
  ...
  location / whs {
    proxy_read_timeout 600s;
    proxy_connect_timeout 600s;
    keepalive_timeout 600s;
    proxy_pass http://127.0.0.1:8067;
  }
  ...
}
```

## Web hooks
```
# test 1
curl -X POST --location 'http://127.0.0.1:8067' \
--header 'Content-Type: application/json' \
--data '{
    "taskName": "test",
    "otherParams": "fdassaf/fasdfsa"
}'
```

```
# test 2
curl -X POST --location 'http://127.0.0.1:8067' \
--header 'Content-Type: application/json' \
--data '{
    "taskName": "test2",
    "otherParams": "fdassaf/fasdfsa"
}'
```

## MIT License and Anti 996 License.

## Copyright &copy; 2023 LinQuan.