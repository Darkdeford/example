/* eslint-disable */
let helpers = require('../../app/e2e/helpers.js');
let USERS = require('../../app/e2e/users.json');

function documentsSpec() {
    describe('documents management', () => {
        helpers.login(USERS[0]);



        afterAll(() => {
            helpers.logout();
        });
    });
}

documentsSpec();