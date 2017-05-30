import config from 'lspConfig';
import _ from 'lodash/fp';
import auth from 'auth/logic/auth';
import grid from 'utils/lsp-grid/grid';

const DEFAULT_SORT_COLUMN = 'creationDate';
const DEFAULT_SORT_DIRECTION = 'false';
const DEFAULT_MIME_TYPE = 'text/plain';

function initializeModel(deps, model) {
    return _.merge(model, {
        documents: {
            grid: grid.applyGrid(fetchData.bind(null, deps.restSrv), 'documents.grid', {
                [config.pageSizeKey]: config.defaultPageSize[2],
                [config.sortColumnKey]: DEFAULT_SORT_COLUMN,
                [config.directionKey]: DEFAULT_SORT_DIRECTION
            })
        }
    });
}

// register restSrv context
function registerRestSrvContext(deps, model) {
    deps.documentsRestSrv = deps.restSrv.factory('documents', auth.handleReauth.bind(null, deps, model));
    return deps;
}

function fetchData(restSrv, model, parameters) {
    return Promise.all([tagsList(restSrv, model), categoriesList(restSrv, model), documentsList(restSrv, model, parameters)]).then((response) => {
        let tags = response[0].tags;
        let categories = response[1];
        let documents = response[2].content;
        let showRemovableTags = _.isEmpty(parameters.filters);
        let transformedDocuments = prepareDocumentsForUI(documents, categories);
        model.documents.categories = categories;
        model.documents.grid.data = transformedDocuments;
        model.documents.tags = prepareTagsForUI(model, tags, showRemovableTags);


        return model.documents.grid.data;
    });
}

function prepareTagsForUI(model, tags, showRemovable) {
    let usedTags = getUsedTags(model.documents.grid.data);
    return tags.map((tag) => {
        let isRemovable = usedTags.indexOf(tag) === -1;
        return {
            isRemovable,
            name: tag,
            show: (!isRemovable) || (isRemovable && showRemovable)
        };
    }).sort(sortTags);
}

function sortTags(a, b) {
    if (a.isRemovable && !b.isRemovable) {
        return 1;
    }
    if (!a.isRemovable && b.isRemovable) {
        return -1;
    }
    return sortByField('name', a, b);
}

function sortByField(field, a, b) {
    let fieldA = a[field].toLowerCase();
    let fieldB = b[field].toLowerCase();
    if (fieldA < fieldB) {
        return -1;
    }
    if (fieldA > fieldB) {
        return 1;
    }
    return 0;
}

function getUsedTags(documents) {
    return _.uniq(documents.reduce((tags, document) => tags.concat(document.tags), []));
}

function documentsList(restSrv, model, parameters) {
    return restSrv.list(model.session.rest.documents.documentsList, parameters);
}

function tagsList(restSrv, model) {
    return restSrv.list(model.session.rest.documents.tagsList);
}

function categoriesList(restSrv, model) {
    return restSrv.list(model.session.rest.documents.categories).then((categories) => categories.sort(sortByField.bind(null, 'documentTypeName')));
}

function prepareDocumentsForUI(documentList, categories) {
    let documents = documentList || [];
    return documents.map((document) => {
        let category = _.find({ documentTypeId: document.type.documentTypeId }, categories);
        let mimeType = document.mimeType;
        let creationDate = document.creationDate;
        let documentNameSplitted = document.name.split('.');
        return {
            id: document.id,
            title: document.guiName,
            categoryId: document.type.documentTypeId,
            thumbnail: document.thumbnail,
            tags: document.tags ? document.tags : [],
            dateTimestamp: document.creationDate,
            dateCreated: !!creationDate ? creationDate : '',
            jurisdictionId: document.jurisdiction.jurisdictionId,
            fileName: document.name,
            type: `.${documentNameSplitted[documentNameSplitted.length - 1].toLowerCase()}`,
            fileType: !!mimeType ? mimeType.split('/')[1] : DEFAULT_MIME_TYPE,
            categoryName: category.documentTypeName
        };
    });
}

function downloadDocument(deps, model, document) {
    let downloadResult = deps.restSrv.downloadBlob(`${model.session.rest.documents.download}/${document.id}`);
    downloadResult.promise.then((result) => {
        window.saveAs(result.data, document.fileName);
    });
    return downloadResult;
}

function saveDocument(deps, model, document) {
    return deps.documentsRestSrv.update(model.session.rest.documents.update, transformDocumentForUpdate(document), { id: document.id })
        .then(() => model.documents.grid.fetchData(model));
}

function transformDocumentForUpdate(document) {
    return {
        id: document.id,
        name: document.fileName,
        guiName: document.title,
        mimeType: document.fileType,
        tags: document.tags,
        jurisdiction: {
            jurisdictionId: document.jurisdictionId
        },
        type: {
            documentTypeId: document.categoryId
        }
    };
}

function removeDocument(deps, model, document) {
    return deps.documentsRestSrv.remove(model.session.rest.documents.remove, { id: document.id }).then(() => model);
}

function uploadDocument(deps, model, document) {
    return deps.documentsRestSrv.create(model.session.rest.documents.create, transformDocumentForCreation(document))
        .then(() => {
            deps.AlertService.doAlertSuccess(deps.gettextCatalog.getString('Document uploaded successfully'));
            return model.documents.grid.fetchData(model);
        }).catch(() => {
            deps.AlertService.doAlertError(deps.gettextCatalog.getString('Error while uploading document'));
            return model;
        });
}

function transformDocumentForCreation(documentToTransform) {
    let document = _.merge(documentToTransform.formData, documentToTransform.fileData);
    let thumbnailSource = _.get('thumbnailData.fileSource', documentToTransform);
    return {
        name: document.fileName,
        guiName: document.name,
        source: document.fileSource ? document.fileSource.split(',')[1] : '',
        tags: document.tags ? document.tags : [],
        mimeType: document.fileType || DEFAULT_MIME_TYPE,
        thumbnail: thumbnailSource ? thumbnailSource.split(',')[1] : '',
        jurisdiction: {
            jurisdictionId: document.jurisdictionId
        },
        type: {
            documentTypeId: document.categoryId
        }
    };
}

function createCategory(deps, model, category) {
    return deps.documentsRestSrv.create(model.session.rest.documents.category.create, category).then(() =>
        categoriesList(deps.restSrv, model).then((categories) => {
            model.documents.categories = categories;
        })
    );
}

function removeCategory(deps, model, category) {
    return deps.documentsRestSrv.remove(model.session.rest.documents.category.remove, { id: category.documentTypeId }).then(() => {
        model.documents.categories = _.remove((_category) => _category.documentTypeId === category.documentTypeId, model.documents.categories);
        return model;
    });
}

function removeTag(deps, model, tag) {
    return deps.documentsRestSrv.remove(model.session.rest.documents.tag.remove, { tag }).then(() => {
        model.documents.tags = _.remove((_tag) => _tag.name === tag, model.documents.tags);
        return model;
    });
}

export default {
    initializeModel,
    registerRestSrvContext,
    documentsList,
    downloadDocument,
    saveDocument,
    removeDocument,
    uploadDocument,
    createCategory,
    removeCategory,
    removeTag
};
