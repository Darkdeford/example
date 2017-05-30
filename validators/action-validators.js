import _ from 'lodash/fp';
import roles from 'app/validators/roles';

function canEditDocuments(model) {
    let userRole = _.get('session.role', model);
    return roles.UBER_ADMIN_ROLES.indexOf(userRole) >= 0;
}

function canShowHeader(model) {
    let userRole = _.get('session.role', model);
    return roles.ADMIN_ROLES.indexOf(userRole) >= 0;
}

const permissions = {
    'documents.editDocuments': [canEditDocuments],
    'documents.showHeader': [canShowHeader]
};

export default permissions;