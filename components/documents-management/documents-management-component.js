import angular from 'angular';
import lspConfig from 'lspConfig';
import _ from 'lodash/fp';

import documentsManagementTemplate from './documents-management.html!text';
import uploadFormModalTemplate from './upload-form-modal/upload-form-modal.html!text';
import createCategoryModalTemplate from './views/create-category-modal.html!text';
import removeCategoryConfirmTemplate from './views/category-delete-confirm.html!text';
import removeTagConfirmTemplate from './views/tag-delete-confirm.html!text';

const defaultSort = 'Date DESC';

@Inject('$mdDialog', '$scope', '$q', 'gettextCatalog')
class DocumentsManagementController {
    constructor() {
        this.jurisdictionId = lspConfig.jurisdictionId;
        this.activeCategory = {};
        this.folders = this.getFolders();
        this.sortByOptions = this.getSortByOptions();
        this.sortBy = defaultSort;
    }

    getFolders() {
        return [
            {
                name: this.gettextCatalog.getString('All'),
                fileType: null,
                active: true
            }, {
                name: this.gettextCatalog.getString('Documents'),
                fileType: 'document',
                active: false
            },{
                name: this.gettextCatalog.getString('Audio'),
                fileType: 'audio',
                active: false
            }, {
                name: this.gettextCatalog.getString('Images'),
                fileType: 'image',
                active: false
            }, {
                name: this.gettextCatalog.getString('Video'),
                fileType: 'video',
                active: false
            }
        ];
    }

    getSortByOptions() {
        return [
            {
                label: this.gettextCatalog.getString('A-Z'),
                column: 'guiName',
                ascending: 'true'
            }, {
                label: this.gettextCatalog.getString('Z-A'),
                column: 'guiName',
                ascending: 'false'
            }, {
                label: this.gettextCatalog.getString('Date Ascending'),
                column: 'creationDate',
                ascending: 'true'
            }, {
                label: this.gettextCatalog.getString('Date Descending'),
                column: 'creationDate',
                ascending: 'false'
            }
        ];
    }

    onViewTypeClick(view) {
        this.views.forEach(view => view.active = false);
        view.active = true;
    }

    onFileTypeClick(folder) {
        this.folders.forEach(folder => folder.active = false);
        folder.active = true;
        this.filters.fileType = folder.fileType;
        this.clearTags();
        this.filterDocuments();
    }

    onCategoryClick(category) {
        this.activeCategory = this.isCategoryActive(category) ? {} : category;
        this.filters.documentType = this.activeCategory.documentTypeId;
        this.clearTags();
        this.filterDocuments();
    }

    isCategoryActive(category) {
        return category.documentTypeId === this.activeCategory.documentTypeId;
    }

    onTagClick($event, tag) {
        tag.isRemovable ? this.removeTag($event, tag.name) : this.selectTag(tag.name);
    }

    clearTags() {
        this.filters.tag = [];
    }

    removeTag($event, tag) {
        $event.stopPropagation();
        $event.preventDefault();

        let params = {
            controller: () => {},
            controllerAs: 'ctrl',
            template: removeTagConfirmTemplate,
            locals: {
                deleteTag: () => this.$mdDialog.hide(true),
                keepTag: () => this.$mdDialog.hide(false)
            }
        };

        this.showComplexDialog({params}).then((result) => {
            if (result) this.onRemoveTag({tag});
        });
    }

    selectTag(tagName) {
        this.updateActiveTagsList(tagName);
        this.tagsBusy = this.$q((resolve) => {
            this.filterDocuments().then(() => _.debounce(1000, resolve)()).catch(() => _.debounce(1000, resolve)());
        });
    }

    updateActiveTagsList(tagName) {
        let tagIndex = this.filters.tag.indexOf(tagName);
        let tagsListContainsTag = tagIndex !== -1;
        tagsListContainsTag ? this.filters.tag.splice(tagIndex, 1) : this.filters.tag.push(tagName);
    }

    isTagActive(tagName) {
        return this.filters.tag.indexOf(tagName) !== -1;
    }

    removeCategory($event, category) {
        $event.stopPropagation();
        $event.preventDefault();

        let params = {
            controller: () => {},
            controllerAs: 'ctrl',
            template: removeCategoryConfirmTemplate,
            locals: {
                deleteCategory: () => this.$mdDialog.hide(true),
                keepCategory: () => this.$mdDialog.hide(false)
            },
        };

        this.showComplexDialog({params}).then((result) => {
            if (result) this.onRemoveCategory({category});
        })


    }

    onSortDocuments(column, direction) {
        this.sortDocuments({column, direction});
    }

    openUploadFilesDialog() {
        this.$mdDialog.show({
            template: uploadFormModalTemplate,
            controller: 'UploadFormModalController as ctrl',
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            bindToController: true,
            locals: {
                categories: this.model.documents.categories,
                jurisdictionId: this.jurisdictionId,
                close: this.$mdDialog.hide,
                onUpload: this.onUpload
            },
            onComplete
        });

        function onComplete(scope) {
            let ctrl = scope.ctrl;

            ctrl.fileInput = document.querySelector('input.upload-file');
            ctrl.fileInput.addEventListener('change', ctrl.fileChanged.bind(null, 'file'));

            ctrl.thumbnailInput = document.querySelector('input.upload-thumbnail');
            ctrl.thumbnailInput.addEventListener('change', ctrl.fileChanged.bind(null, 'thumbnail'));
            ctrl.$scope.$on('$destroy', () => {
                ctrl.fileInput.removeEventListener('change', ctrl.fileChanged);
                ctrl.thumbnailInput.removeEventListener('change', ctrl.fileChanged);
                ctrl.fileReader.onloadend = null;
            });
        }
    }

    openCreateCategoryDialog() {
        let controller = {
            close: this.$mdDialog.hide,
            addCategory: (newCategoryForm, documentTypeName) => {
                newCategoryForm.$setSubmitted();

                if (newCategoryForm.$valid) {
                    let category = {
                        jurisdictionId: this.jurisdictionId,
                        documentTypeName
                    };

                    this.onSaveCategory({category});
                    this.$mdDialog.hide();
                }
            }
        };

        this.$mdDialog.show({
            template: createCategoryModalTemplate,
            controller: () => controller,
            controllerAs: 'ctrl',
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            bindToController: true
        });
    }
}

export default class DocumentsManagementComponent {
    constructor() {
        this.template = documentsManagementTemplate;
        this.controller = DocumentsManagementController;
        this.bindings = {
            model: '<',
            fileSizeLimit: '<',
            header: '<',
            canEdit: '<',
            onUpload: '&',
            canUploadDocument: '<',
            onSaveCategory: '&',
            onRemoveCategory: '&',
            onRemoveTag: '&',
            filterDocuments: '&',
            filters: '=',
            isGridViewActive: '&',
            sortDocuments: '&',
            showComplexDialog: '&',
            setViewActive: '&',
            isViewActive: '&',
            views: '<'
        };
        return this;
    }
}