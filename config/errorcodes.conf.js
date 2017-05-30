import angular from 'angular';
import config from 'lspConfig';
import _ from 'lodash/fp';

export default angular.module('documents-errorcodes', [])
    .run(['gettextCatalog', function errorCodes(gettextCatalog) {
        config.errorCodes = _.merge(config.errorCodes, {
            documents: {
                DOCUMENT_TYPE_IS_IN_USE: { title: gettextCatalog.getString('Category has documents. You cannot delete a category that has documents.') },
                DOCUMENT_ALREADY_EXISTS: { title: gettextCatalog.getString('Document already exists.') },
                CANNOT_BE_EMPTY: { title: gettextCatalog.getString('Document cannot be empty.') },
                DOCUMENT_TYPE_EXIST: { title: gettextCatalog.getString('Category with this name already exists.') },
                INVALID_SIZE: { title: gettextCatalog.getString('Size must be between 0 and 255 characters.') },
                INVALID_THUMBNAIL_FORMAT: { title: gettextCatalog.getString('File must be an image in JPEG / JPG or PNG format.') },
                INVALID_THUMBNAIL_SIZE: { title: gettextCatalog.getString('Maximum thumbnail size is 256KB.') },
                INVALID_THUMBNAIL: { title: gettextCatalog.getString('Maximum thumbnail size is 256KB.') },
                INVALID_THUMBNAIL_DIMENSIONS: { title: gettextCatalog.getString('Maximum thumbnail size of 300x300px was exceeded.') },
                INVALID_FILE_SIZE: { title: gettextCatalog.getString('File size must be below 50 MB".') },
                TAG_NOT_FOUND: { title: gettextCatalog.getString('Tag not found.') },
                DOCUMENT_NOT_FOUND: { title: gettextCatalog.getString('Document not found.') },
                DOCUMENT_TYPE_NOT_FOUND: { title: gettextCatalog.getString('Category not found.') },
                INVALID_CONTENT_SIZE: { title: gettextCatalog.getString('The maximum file size must be up to 50 MB.') }
            }
        });
    }]);
