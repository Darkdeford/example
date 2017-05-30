import roles from 'app/permissions/roles';

const permissions = {
    'model.documents.applyFilters': {
        roles: roles.LOGGED_USER_ROLES
    },
    'model.documents.sortByColumn': {
        roles: roles.LOGGED_USER_ROLES
    },
    'documents.tagsList': {
        roles: roles.LOGGED_USER_ROLES
    },
    'documents.editDocuments': {
        roles: roles.UBER_ADMIN_ROLES
    },
    'documents.showHeader': {
        roles: roles.ADMIN_ROLES
    },
    'documents.downloadDocument': {
        roles: roles.LOGGED_USER_ROLES
    },
    'documents.saveDocument': {
        roles: roles.ADMIN_ROLES
    },
    'documents.removeDocument': {
        roles: roles.ADMIN_ROLES
    },
    'documents.uploadDocument': {
        roles: roles.ADMIN_ROLES
    },
    'documents.createCategory': {
        roles: roles.ADMIN_ROLES
    },
    'documents.removeCategory': {
        roles: roles.ADMIN_ROLES
    }
};

export default permissions;
