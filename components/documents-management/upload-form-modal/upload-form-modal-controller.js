import _ from 'lodash/fp';

const defaultDocument = {
    formData: {
        pageType: null,
        jurisdictionId: null,
        tags: []
    },
    fileData: {},
    thumbnailData: {}
};

const onChangeFn = {
    'file': 'onFileChanged',
    'thumbnail': 'onThumbnailChanged'
};

const FILE_SIZE_LIMIT = 1024 * 1024 * 50 // ~50mb

@Inject('$scope')
class UploadFormModalController {

    constructor() {
        this.fileInput = null;
        this.thumbnailInput = null;
        this.onChangeFn = onChangeFn;
        this.document = this.initializeDocument(_.cloneDeep(defaultDocument));
        this.errors = {
            fileSizeExceeded: false
        };
        this.fileReader = new FileReader();
        this.fileChanged = this.fileChanged.bind(this);
    }

    initializeDocument(document) {
        document.formData.pageType = this.documentType;
        document.formData.jurisdictionId = this.jurisdictionId;
        return document;
    }

    onFileChanged(fileData, fileErrors) {
        this.document.fileData = fileData;
        this.fileErrors = fileErrors;
    }
    
    onThumbnailChanged(thumbnailData) {
        this.document.thumbnailData = thumbnailData;
    }

    upload(uploadForm) {
        this.document = this.handleCategory(_.cloneDeep(this.document.formData));
        uploadForm.$setSubmitted();

        if (uploadForm.$valid && !this.fileErrors) {
            this.onUpload({
                document: _.cloneDeep(this.document)
            });
            uploadForm.$setPristine();
            uploadForm.$setUntouched();
            this.close();
        }
    }

    gatherErrors() {
        this.errors.fileSizeExceeded = this.file.size > FILE_SIZE_LIMIT;
    }

    handleCategory(formData) {
        if (_.findIndex({ documentTypeId: formData.categoryId * 1 }, this.categories) === -1) {
            this.document.formData = this.removeCategoryFromList(formData, formData.categoryId);
        }
        return this.document;
    }

    removeCategoryFromList(formData, categoryId) {
        return _.omit((value) => value === categoryId, formData);
    }

    fileReaderOnLoadEnd(type) {
        let onChangeFnName = this.onChangeFn[type]
        this.$scope.$evalAsync(this[onChangeFnName]({
                fileName: this.file.name,
                fileType: this.file.type,
                fileSource: this.fileReader.result
            },
            Object.keys(this.errors).every((e) => this.errors[e])
        ));
    }

    fileChanged(type) {
        this.file = this[`${type}Input`].files[0];
        this.fileReader.readAsDataURL(this.file);
        this.gatherErrors();
        this.fileReader.onloadend = this.fileReaderOnLoadEnd.bind(this, type);
    }
}

export default UploadFormModalController;