import { App } from 'antd';

let message = {
    success: () => { },
    error: () => { },
    warning: () => { },
    info: () => { },
    loading: () => { },
};
let notification = {
    success: () => { },
    error: () => { },
    warning: () => { },
    info: () => { },
};
let modal = {
    confirm: () => { },
    success: () => { },
    error: () => { },
    warning: () => { },
    info: () => { },
};

export default function AntdGlobal() {
    const staticFunction = App.useApp();

    message.success = staticFunction.message.success;
    message.error = staticFunction.message.error;
    message.warning = staticFunction.message.warning;
    message.info = staticFunction.message.info;
    message.loading = staticFunction.message.loading;

    notification.success = staticFunction.notification.success;
    notification.error = staticFunction.notification.error;
    notification.warning = staticFunction.notification.warning;
    notification.info = staticFunction.notification.info;

    modal.confirm = staticFunction.modal.confirm;
    modal.success = staticFunction.modal.success;
    modal.error = staticFunction.modal.error;
    modal.warning = staticFunction.modal.warning;
    modal.info = staticFunction.modal.info;

    return null;
}

export { message, notification, modal };
