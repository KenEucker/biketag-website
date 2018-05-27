(function ($) {

    var imgurIntegration = {
        imgurAlbumHash: '3OMZJ6a',
        imgurAuthorization: 'Client-ID 79ea70333c45883',
        imgurAccessToken: null,
        imgurAlbumPictures: null,

        createAlbum: function (ids) {

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
                    window.imgurIntegration.imgurAlbumPictures = data.data.sort(function(image1, image2){
                        return new Date(image2.datetime) - new Date(image1.datetime);
                    });

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

        addImagesToAlbum: function (ids, albumHash) {
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

        biketagImageTemplate: function (image, title) {
            var thumbnail = image.link.substr(0, image.link.length - 4) + 'l' + image.link.substr(-4);
            var tagNumber = '';
            var tagCredit = '';

            if (image.description) {
                var split = image.description.split(' ');
                tagNumber = split[0];
                tagCredit = split[split.length - 1];
            }

            return '<h2>' + title + '</h2>\
                    <a href="' + image.link + '" target="_blank">\
                        <span>' + tagNumber + '</span>\
                        <span>' + tagCredit + '</span>\
                        <img src="' + thumbnail + '">\
                    </a>';
        },

        showLatestTagImages: function () {
            if (!window.imgurIntegration.imgurAlbumPictures) {
                return window.imgurIntegration.getImgurAlbumPictures(null, window.imgurIntegration.showLatestTagImages);
            }

            var images = window.imgurIntegration.imgurAlbumPictures;
            var lastImage = images[0];
            var secondToLastImage = images.length > 1 ? images[1] : null;
            var thirdToLastImage = images.length > 2 ? images[2] : null;
            var lastImageThumbnail = lastImage.link.substr(0, lastImage.link.length - 4) + 'l' + lastImage.link.substr(-4);

            $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(lastImage, "Tag You're It!") );
            if (secondToLastImage) {
                $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(secondToLastImage, "Last tag proof") );
            }
            if (thirdToLastImage) {
                $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(thirdToLastImage, "Last tag") );
            }
        },

        uploadFileToImgur: function (file, description, input, next) {
            // Begin file upload
            console.log("Uploading file to Imgur..");
            $(input).after('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');

            var formData = new FormData();
            formData.append("image", file);
            formData.append("album", window.imgurIntegration.imgurAlbumHash);
            formData.append("description", description);

            var settings = {
                async: false,
                crossDomain: true,
                processData: false,
                data: formData,
                contentType: false,
                type: 'POST',
                url: 'https://api.imgur.com/3/image',
                headers: {
                    Authorization: window.imgurIntegration.imgurAccessToken,
                    Accept: 'application/json'
                },
                mimeType: 'multipart/form-data'
            };

            // Response contains stringified JSON
            // Image URL available at response.data.link
            $.ajax(settings).done(function (response) {
                $(input).next().remove();
                next();
            });
        },

        getImgurTokens: function (success) {
            var self = this;
            fetch('/auth/imgur/getToken', {
                method: 'POST',
                body: JSON.stringify({ hello: 'world' }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) { return res.json() })
                .catch(function (error) { console.error('Error:', error) })
                .then(function (response) {
                    var imgurTokens = response.imgurTokens;

                    if (imgurTokens && typeof imgurTokens == 'object') {
                        self.imgurAccessToken = 'Bearer ' + imgurTokens.imgurAccessToken || self.imgurAccessToken;
                        self.imgurAlbumHash = imgurTokens.imgurAlbumHash || self.imgurAlbumHash;
                        self.imgurAuthorization = 'Client-ID ' + imgurTokens.imgurAuthorization || self.imgurAuthorization;

                        return success(response);
                    }
                });
        },

        init: function () {
            var self = this;
            this.getImgurTokens(function (response) {
                self.showLatestTagImages();
                console.log('imgur integration initialized.');
            });

        }
    };

    window.imgurIntegration = imgurIntegration;
    imgurIntegration.init();

    $('form #submitTheDamnFuckingForm').click(function (e) {
        e.preventDefault();
        var form = $(e.currentTarget).closest('form');
        var fileInputs = form.find('input[type="file"]');
        var files = [], user = '';

        // get the latest tag number
        var nextTagNumber = window.imgurIntegration.imgurAlbumPictures.length ? Number(window.imgurIntegration.imgurAlbumPictures[0].description.split(' ')[0].substr(1)) + 1 : 1;
        user = form.find('input[name="name"]').val();

        for (var i = 0; i < fileInputs.length; ++i) {
            var $files = fileInputs[i].files;
            var $input = $(fileInputs[i]);

            if ($files.length) {

                // Reject big files
                if ($files[0].size > $(this).data("max-size") * 1024) {
                    console.log("Please select a smaller file");
                    return false;
                }

                files.push($files[0]);
            } else {
                console.log('I need both files!');
                return;
            }
        }

        window.imgurIntegration.uploadFileToImgur(files[0], '#' + (nextTagNumber - 1) + ' proof for ' + user, fileInputs[0], function() {
            window.imgurIntegration.uploadFileToImgur(files[1], '#' + nextTagNumber + ' tag by ' + user, fileInputs[1], function() {
                location.reload(true);
            });
        });
        
    });
})(jQuery);