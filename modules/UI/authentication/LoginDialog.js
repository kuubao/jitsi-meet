/* global $, APP, config, JitsiMeetJS */

import { toJid } from '../../../react/features/base/connection';

const ConnectionErrors = JitsiMeetJS.errors.connection;

/**
 * Build html for "password required" dialog.
 * @returns {string} html string
 */
function getPasswordInputHtml() {
    let placeholder = config.hosts.authdomain
        ? "user identity"
        : "user@domain.net";

    return `
        <input name="username" type="text" 
               class="input-control"
               placeholder=${placeholder} autofocus>
        <input name="password" type="password"
               class="input-control"
               data-i18n="[placeholder]dialog.userPassword">`;
}

/**
 * Generate cancel button config for the dialog.
 * @returns {Object}
 */
function cancelButton() {
    return {
        title: APP.translation.generateTranslationHTML("dialog.Cancel"),
        value: false
    };
}

/**
 * Auth dialog for JitsiConnection which supports retries.
 * If no cancelCallback provided then there will be
 * no cancel button on the dialog.
 *
 * @class LoginDialog
 * @constructor
 *
 * @param {function(jid, password)} successCallback
 * @param {function} [cancelCallback] callback to invoke if user canceled.
 */
function LoginDialog(successCallback, cancelCallback) {
    let loginButtons = [{
        title: APP.translation.generateTranslationHTML("dialog.Ok"),
        value: true
    }];
    let finishedButtons = [{
        title: APP.translation.generateTranslationHTML('dialog.retry'),
        value: 'retry'
    }];

    // show "cancel" button only if cancelCallback provided
    if (cancelCallback) {
        loginButtons.push(cancelButton());
        finishedButtons.push(cancelButton());
    }

    const states = {
        login: {
            titleKey: 'dialog.passwordRequired',
            html: getPasswordInputHtml(),
            buttons: loginButtons,
            focus: ':input:first',
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v) {
                    let jid = f.username;
                    let password = f.password;
                    if (jid && password) {
                        connDialog.goToState('connecting');
                        successCallback(toJid(jid, config.hosts), password);
                    }
                } else {
                    // User cancelled
                    cancelCallback();
                }
            }
        },
        connecting: {
            titleKey: 'dialog.connecting',
            html:   '<div id="connectionStatus"></div>',
            buttons: [],
            defaultButton: 0
        },
        finished: {
            titleKey: 'dialog.error',
            html:   '<div id="errorMessage"></div>',
            buttons: finishedButtons,
            defaultButton: 0,
            submit: function (e, v) {
                e.preventDefault();
                if (v === 'retry') {
                    connDialog.goToState('login');
                } else {
                    // User cancelled
                    cancelCallback();
                }
            }
        }
    };

    var connDialog = APP.UI.messageHandler.openDialogWithStates(
        states, { persistent: true, closeText: '' }, null
    );

    /**
     * Displays error message in 'finished' state which allows either to cancel
     * or retry.
     * @param error the key to the error to be displayed.
     * @param options the options to the error message (optional)
     */
    this.displayError = function (error, options) {

        let finishedState = connDialog.getState('finished');

        let errorMessageElem = finishedState.find('#errorMessage');

        let messageKey;
        if (error === ConnectionErrors.PASSWORD_REQUIRED) {
            // this is a password required error, as login window was already
            // open once, this means username or password is wrong
            messageKey = 'dialog.incorrectPassword';
        }
        else {
            messageKey = 'dialog.connectErrorWithMsg';

            if (!options)
                options = {};

            options.msg = error;
        }

        errorMessageElem.attr("data-i18n", messageKey);

        APP.translation.translateElement($(errorMessageElem), options);

        connDialog.goToState('finished');
    };

    /**
     *  Show message as connection status.
     * @param {string} messageKey the key to the message
     */
    this.displayConnectionStatus = function (messageKey) {
        let connectingState = connDialog.getState('connecting');

        let connectionStatus = connectingState.find('#connectionStatus');
        connectionStatus.attr("data-i18n", messageKey);
        APP.translation.translateElement($(connectionStatus));
    };

    /**
     * Closes LoginDialog.
     */
    this.close = function () {
        connDialog.close();
    };
}

export default {

    /**
     * Show new auth dialog for JitsiConnection.
     *
     * @param {function(jid, password)} successCallback
     * @param {function} [cancelCallback] callback to invoke if user canceled.
     *
     * @returns {LoginDialog}
     */
    showAuthDialog: function (successCallback, cancelCallback) {
        return new LoginDialog(successCallback, cancelCallback);
    },

    /**
     * Show notification that external auth is required (using provided url).
     * @param {string} url URL to use for external auth.
     * @param {function} callback callback to invoke when auth popup is closed.
     * @returns auth dialog
     */
    showExternalAuthDialog: function (url, callback) {
        var dialog = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            callback
        );

        if (!dialog) {
            APP.UI.messageHandler.openMessageDialog(null, "dialog.popupError");
        }

        return dialog;
    },

    /**
     * Shows a notification that authentication is required to create the
     * conference, so the local participant should authenticate or wait for a
     * host.
     *
     * @param {string} room - The name of the conference.
     * @param {function} onAuthNow - The callback to invoke if the local
     * participant wants to authenticate.
     * @returns dialog
     */
    showAuthRequiredDialog(room, onAuthNow) {
        const msg = APP.translation.generateTranslationHTML(
            '[html]dialog.WaitForHostMsg',
            { room }
        );
        const buttonTxt = APP.translation.generateTranslationHTML(
            'dialog.IamHost'
        );
        const buttons = [{
            title: buttonTxt,
            value: 'authNow'
        }];

        return APP.UI.messageHandler.openDialog(
            'dialog.WaitingForHost',
            msg,
            true,
            buttons,
            (e, submitValue) => {
                // Do not close the dialog yet.
                e.preventDefault();

                // Open login popup.
                if (submitValue === 'authNow') {
                    onAuthNow();
                }
            }
        );
    }
};
