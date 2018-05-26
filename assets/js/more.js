(function ($) {

    var imgurIntegration = {
        imgurAlbumHash: '3OMZJ6a',
        imgurAuthorization: 'Client-ID 79ea70333c45883',
        imgurAlbumPictures: null,

        createAlbum: function(ids) {

            var url = 'https://api.imgur.com/3/album/';

            var formData = new FormData();
            formData.append("ids", ids);

            $.ajax({
                async: false,
                crossDomain: true,
                processData: false,
                contentType: false,
                url: url,
                data: formData,
                type: 'POST',
                url: url,
                headers: {
                    Authorization: window.imgurIntegration.imgurAuthorization,
                    Accept: 'application/json'
                },
                mimeType: 'multipart/form-data'
            }).done(function (response) {
                debugger;
                console.log(response);
            });

        },

        getImgurAlbumPictures: function (albumHash, callback) {
            if (!albumHash) {
                albumHash = this.imgurAlbumHash;
            }
            $.ajax({
                url: 'https://api.imgur.com/3/album/' + albumHash + '/images',
                success: function (data) {
                    console.log(data);
                    window.imgurIntegration.imgurAlbumPictures = data.data;

                    if (callback) {
                        callback(data);
                    }
                },
                error: function (err) {
                    console.log('error getting images from imgur', err);
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", window.imgurIntegration.imgurAuthorization);
                },
            });
        },

        addImagesToAlbum: function(ids, albumHash) {
            if (!ids) {
                console.log("I can't just add nothing:", ids);
                return;
            } else if (!Array.isArray(ids)) {
                ids = [ids];
            }

            if (!albumHash) {
                albumHash = this.imgurAlbumHash;
            }

            var url = 'https://api.imgur.com/3/album/' + albumHash + '/add';
            console.log('we want to add the following ids to the album ' + albumHash + ' using the URL ' + url, ids);

            var formData = new FormData();
            formData.append("ids", ids);
            formData.append("deleteHashes", ids);

            $.ajax({
                async: false,
                crossDomain: true,
                processData: false,
                contentType: false,
                url: url,
                data: formData,
                type: 'POST',
                url: url,
                headers: {
                    Authorization: window.imgurIntegration.imgurAuthorization,
                    Accept: 'application/json'
                },
                mimeType: 'multipart/form-data'
            }).done(function (response) {
                debugger;
                console.log(response);
                // window.imgurIntegration.addImagesToAlbum();
            });
        },

        showLatestTagImages: function () {
            if (!window.imgurIntegration.imgurAlbumPictures) {
                window.imgurIntegration.getImgurAlbumPictures(null, window.imgurIntegration.showLatestTagImages);
            }

            var images = window.imgurIntegration.imgurAlbumPictures;
            var lastImage = images[images.length - 1];
            var secondToLastImage = images.length > 1 ? images[images.length - 2] : null;

            $('.content .inner').append($('<img src="' + lastImage.link + '">'));
            if (secondToLastImage) {
                $('.content .inner').append($('<img src="' + secondToLastImage.link + '">'));
            }
        },

        uploadFilesToImgur: function (inputs) {

            for (var i = 0; i < inputs.length; ++i) {
                var $files = inputs[i].files;

                if ($files.length) {

                    // Reject big files
                    if ($files[0].size > $(this).data("max-size") * 1024) {
                        console.log("Please select a smaller file");
                        return false;
                    }

                    // Begin file upload
                    console.log("Uploading file to Imgur..");

                    var settings = {
                        async: false,
                        crossDomain: true,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        url: 'https://api.imgur.com/3/image',
                        headers: {
                            Authorization: window.imgurIntegration.imgurAuthorization,
                            Accept: 'application/json'
                        },
                        mimeType: 'multipart/form-data'
                    };

                    var formData = new FormData();
                    formData.append("image", $files[0]);
                    settings.data = formData;

                    // Response contains stringified JSON
                    // Image URL available at response.data.link
                    $.ajax(settings).done(function (response) {
                        debugger;
                        console.log(response);
                        // window.imgurIntegration.addImagesToAlbum();
                    });
                }
            }
        },

        init: function() {
           this.showLatestTagImages();
           console.log('imgur integration initialized.');
        }
    };

    window.imgurIntegration = imgurIntegration;
    imgurIntegration.init();

    $('form #submitTheDamnFuckingForm').click(function(e) {
        e.preventDefault();
        var inputs = $(e.currentTarget.parentNode).find('input[type="file"]');
        imgurIntegration.uploadFilesToImgur(inputs);
    });
})(jQuery);