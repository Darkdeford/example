import angular from 'angular';
import _ from 'lodash/fp';
import lspConfig from 'lspConfig';

import helpers from 'app/app-helpers';

import './config/errorcodes.conf';
import DocumentsManagementComponent from './components/documents-management/documents-management-component';
import UploadFormModalController from './components/documents-management/upload-form-modal/upload-form-modal-controller';


import removeDocumentConfirmTemplate from './views/document-delete-confirm.html!text';
import editDocumentModalTemplate from './views/edit-document-modal.html!text';

import documentsTemplate from './documents.html!text';

let columnHeaders = {
    admin_false: [{
        text: 'Name',
        field: 'guiName',
        sortable: true
    }, {
        text: 'Category',
        field: 'documentCategoryParameter.documentCategory.name',
        sortable: true
    }, {
        text: 'Created',
        field: 'creationDate',
        sortable: true
    }, {
        text: 'File',
        field: 'name',
        sortable: true

    }, {
        text: 'Type'
    }],
    admin_true: [{
        text: 'Name',
        field: 'guiName',
        sortable: true
    }, {
        text: 'Category',
        field: 'documentCategoryParameter.documentCategory.name',
        sortable: true
    }, {
        text: 'Created',
        field: 'creationDate',
        sortable: true
    }, {
        text: 'File',
        field: 'name',
        sortable: true
    }, {
        text: 'Type',
        field: 'extension',
        sortable: true
    }, {
        text: 'Actions',
        flex: '10',
        sortable: false
    }]
};

const gridView = 'grid';
const tableView = 'table';
const fileFormats = {
    '.xls': 'fa-file-excel-o',
    '.xlsx': 'fa-file-excel-o',
    '.rar': 'fa-file-archive-o',
    '.zip': 'fa-file-archive-o',
    '.pdf': 'fa-file-pdf-o',
    '.txt': 'fa-file-text-o',
    '.doc': 'fa-file-word-o',
    '.docx': 'fa-file-word-o',
    '.jpg': 'fa-file-image-o',
    '.jpeg': 'fa-file-image-o',
    '.gif': 'fa-file-image-o',
    '.png': 'fa-file-image-o',
    '.bmp': 'fa-file-image-o',
    '.tiff': 'fa-file-image-o',
    '.aac': 'fa-file-audio-o',
    '.ogg': 'fa-file-audio-o',
    '.wma': 'fa-file-audio-o',
    '.flac': 'fa-file-audio-o',
    '.mp3': 'fa-file-audio-o',
    '.mp4': 'fa-file-video-o',
    '.mpg': 'fa-file-video-o',
    '.mpeg': 'fa-file-video-o',
    '.avi': 'fa-file-video-o',
    '.ppt': 'fa-file-powerpoint-o',
    '.pptx': 'fa-file-powerpoint-o'
};

const rawFilters = {
    tag: []
};

@Inject('$state', '$mdDialog', 'gettextCatalog')
class DocumentsController {
    constructor() {
        this.lspConfig = lspConfig;
        this.currentView = gridView;
        this.filters = _.cloneDeep(rawFilters);
        this.views = this.getViews();
        this.pageHeader = gettextCatalog.getString('Documents');
        this.gridHeader = gettextCatalog.getString('Documents');
        this.uploadFormHeader = gettextCatalog.getString('Upload Document');
        this.headers = columnHeaders[`admin_${this.canEditDocuments}`];
    }

    $onInit() {
        this.prevPage = this.prevPage();
        this.nextPage = this.nextPage();
        this.gotoPage = this.gotoPage();
        this.filterDocuments = this.filterDocuments();
        this.saveDocument = this.saveDocument();
        this.removeDocument = this.removeDocument();
        this.createCategory = this.createCategory();
        this.uploadDocument = this.uploadDocument();
        this.removeCategory = this.removeCategory();
        this.removeTag = this.removeTag();
        this.showComplexDialog = this.showComplexDialog();
        this.filterDocuments.run(this.filters);
    }

    getViews() {
        return [
            {
                name: this.gettextCatalog.getString('Grid'),
                id: 'grid'
            }, {
                name: this.gettextCatalog.getString('Table'),
                id: 'table'
            }
        ]
    }

    setViewActive(view) {
        this.currentView = view === gridView ? gridView : tableView;
    }

    isViewActive(view) {
        return this.currentView === view;
    }

    isGridViewActive() {
        return this.currentView === gridView;
    }

    isTableViewActive() {
        return this.currentView === tableView;
    }

    getGridIconClass(document) {
        return fileFormats[document.type] || 'fa-file';
    }

    sortDocuments(column, direction) {
        this.model.documents.grid.sortByColumn(this.model, column, direction).then(model => {
            this.model = model;
            this.model.documents.grid.fetchData(this.model);
        });
    }

    filter() {
        return this.model.documents.grid.applyFilters(this.model, this.filters).then(model => {
            this.model = model;
            return this.model.documents.grid.fetchData(this.model);
        });
    }

    onSaveDocument(document, documentUpdated) {
        document.title = documentUpdated.title;
        document.categoryId = documentUpdated.categoryId;
        document.tags = documentUpdated.tags;
        this.saveDocument.run(document);
    }

    onRemoveDocument(document) {
        let params = {
            template: removeDocumentConfirmTemplate,
            controller: () => {},
            controllerAs: 'ctrl',
            locals: {
                deleteCategory: () => this.$mdDialog.hide(true),
                keepCategory: () => this.$mdDialog.hide(false)
            }
        };

        this.showComplexDialog(params).then((result) => {
            if (result) {
                this.removeDocument.run(document, this.filters).then(() => {
                    if (this.shouldClearFilters(document)) {
                        this.clearFilters();
                    }

                    this.filterDocuments.run(this.filters);
                });
            }
        });
    }

    clearFiltersAndReload() {
        this.clearFilters();
        this.filterDocuments.run(this.filters);
    }

    clearFilters() {
        this.filters = _.cloneDeep(rawFilters);
    }

    shouldClearFilters(document) {
        this.model.documents.grid.data = this.model.documents.grid.data.filter((_document) => _document.id !== document.id);
        return this.model.documents.grid.data.length === 0;
    }

    onUploadDocument(document) {
        this.uploadDocument.run(document).then(() => this.clearFilters());
    }

    onCreateCategory(category) {
        this.createCategory.run(category);
    }

    onDownloadDocument(document) {
        return this.downloadDocument({ model: this.model, document });
    }

    onRemoveCategory(category) {
        return this.removeCategory.run(category);
    }

    onRemoveTag(tag) {
        return this.removeTag.run(tag);
    }

    openEditDocumentDialog(document, categories) {
        let documentTmp = {
            title: document.title,
            categoryId: document.categoryId,
            tags: _.cloneDeep(document.tags)
        };

        let controller = {
            document,
            documentTmp,
            categories,
            close: this.$mdDialog.hide,
            save: (document, documentUpdated) => {
                this.onSaveDocument(document, documentUpdated);
                this.$mdDialog.hide();
            }
        };

        this.$mdDialog.show({
            template: editDocumentModalTemplate,
            controller: () => controller,
            controllerAs: 'ctrl',
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            bindToController: true
        });
    }

}

class DocumentsComponent {
    constructor() {
        this.template = documentsTemplate;
        this.controller = DocumentsController;
        this.bindings = {
            model: '<',
            canEditDocuments: '<',
            showHeader: '<',
            showCategoryFilter: '<',
            nextPage: '&',
            prevPage: '&',
            gotoPage: '&',
            filterDocuments: '&',
            downloadDocument: '&',
            saveDocument: '&',
            removeDocument: '&',
            uploadDocument: '&',
            createCategory: '&',
            removeCategory: '&',
            removeTag: '&',
            showComplexDialog: '&'
        };
        return this;
    }
}

export default angular.module('documents', ['documents-errorcodes'])
    .component('documents', new DocumentsComponent())
    .component('documentsManagement', new DocumentsManagementComponent())
    .controller('UploadFormModalController', UploadFormModalController)
    .config(['$stateProvider', function configure($stateProvider) {
        $stateProvider.state('documents-view', {
            parent: 'arw',
            url: '/documents',
            template: `<documents data-model="appCtrl.model"
                                  data-filter-documents="appCtrl.dispatch(\'documents.grid.applyFilters\', true)"
                                  data-download-document="appCtrl.actions.documents.downloadDocument(model, document)"
                                  data-save-document="appCtrl.dispatch(\'documents.saveDocument\')"
                                  data-remove-document="appCtrl.dispatch(\'documents.removeDocument\')"
                                  data-upload-document="appCtrl.dispatch(\'documents.uploadDocument\')"
                                  data-create-category="appCtrl.dispatch(\'documents.createCategory\')"
                                  data-remove-category="appCtrl.dispatch(\'documents.removeCategory\')"
                                  data-remove-tag="appCtrl.dispatch(\'documents.removeTag\')"
                                  data-can-edit-documents="appCtrl.checkAccess(\'documents.editDocuments\')"
                                  data-show-header="appCtrl.checkAccess(\'documents.showHeader\', true)"
                                  data-show-complex-dialog="appCtrl.uiHelpers.showComplexDialog" 
                        ></documents>`,
            resolve: {
                redirectTo: () => 'permissions-denied'
            },
            onEnter: helpers.onStateEnterFn
        });
    }]);
