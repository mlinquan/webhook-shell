const lang = new Date().getTimezoneOffset() === -480 ? 'zh-CN' : 'en';

const i18n = {
    'zh-CN': {
        'Please enter a task name: ': '请输入任务名：',
        'Enter to enter the editor: ': '回车进入编辑器：',
        'The task name \'%0\' is a reserved field. Please use another task name.': '任务名"%0"是保留字段，请使用其他任务名。',
        'The task name \'%0\' is illegal, only English letters and numbers are allowed.': '任务名"%0"不合法，只允许英文字母和数字。',
        'The task name \'%0\' already exists, do you want to overwrite it?': '任务名"%0"已存在，是否要覆盖？',
        'The task name \'%0\' is not exists.': '任务名"%0"不存在。',
        'Webhook-shell is running at %0.': 'Webhook-shell 运行于 %0',
        'For safety reasons, parameters are not allowed to include \'&\' and line breaks.': '为了安全考虑，参数中不允许包含 & 和换行符。',
        'Please select the task name you want to modify: ': '请选择要修改的任务名',
        'Please select the task name you want to delete: ': '请选择要删除的任务名',
        'Task \'%0\' has been successfully deleted': '任务"%0"已被删除',
        'Delete canceled': '已取消删除',
        'Webhook-shell not started': 'Webhook-shell 未启动',
        'Webhook-shell not started or Webhook-shell process exception': 'Webhook-shell未启动或Webhook-shell进程异常',
        'The current installed version is %0, The latest version is %1': '当前版本为%0, 最新版本为%1'
    }
};

const _e = function(msg) {
    let returnMsg = i18n[lang] && i18n[lang][msg] || msg;
    if (arguments.length > 1) {
        const argument_list = Array.from(arguments).slice(1);
        argument_list.forEach((a, index) => {
            returnMsg = returnMsg.replace(`%${index}`, a);
        });
    }
    return returnMsg;
};

module.exports = _e;
