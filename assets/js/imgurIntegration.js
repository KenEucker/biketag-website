(function ($) {

    var imgurIntegration = {
        imgurAlbumHash: 'Y9PKtpI',
        imgurAuthorization: 'Client-ID 79ea70333c45883',
        imgurAccessToken: null,
        imgurAlbumPictures: null,
        imgurAlbumPicturesRefreshFrequency: 60000,

        createAlbum: function (ids) {

            var url = 'https://api.imgur.com/3/album/';

            var formData = new FormData();
            formData.append("ids", ids);

            $.ajax({
                crossDomain: true,
                processData: false,
                contentType: false,
                url: url,
                data: formData,
                type: 'POST',
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

        getCurrentTagInformation() {
            var tagInformation = {
                currentTagNumber: 0,
                hasTag: false,
                currentTag: null,
            };

            if (window.imgurIntegration.imgurAlbumPictures.length) {
                tagInformation.currentTag = window.imgurIntegration.imgurAlbumPictures[0];

                if (tagInformation.currentTag) {
                    tagInformation.hasTag = true;
                    tagInformation.currentTagNumber = Number(tagInformation.currentTag.description.split(' ')[0].substr(1));
                }
            }

            tagInformation.nextTagNumber = tagInformation.currentTagNumber + 1;

            return tagInformation;
        },

        getImgurAlbumInfo: function (albumHash, callback) {
            if (!albumHash) {
                albumHash = this.imgurAlbumHash;
            }
            $.ajax({
                url: 'https://api.imgur.com/3/album/' + albumHash + '',
                success: function (data) {
                    console.log(data);

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

        refreshImgurAlbumInfo: function(albumInfo) {
            if (albumInfo && albumInfo.data) {
                albumInfo = albumInfo.data;
            } else {
                return;
            }

            if (albumInfo.images_count != window.imgurIntegration.imgurAlbumPictures.length) {
                console.log('image count has changed, updating most recent tags');
                window.imgurIntegration.imgurAlbumPictures = window.imgurIntegration.getImgurAlbumImagesByUploadDate(albumInfo.images);
                window.imgurIntegration.showLatestTagImages();
            }
        },

        getImgurAlbumImagesByUploadDate: function (images, newestFirst) {
            if (!newestFirst) {
                return images.sort(function(image1, image2){
                    return new Date(image2.datetime) - new Date(image1.datetime);
                });
            } else {
                return images.sort(function(image1, image2){
                    return new Date(image1.datetime) - new Date(image2.datetime);
                });
            }
        },

        getImgurAlbumPictures: function (albumHash, callback) {
            if (!albumHash) {
                albumHash = this.imgurAlbumHash;
            }
            $.ajax({
                url: 'https://api.imgur.com/3/album/' + albumHash + '/images',
                success: function (data) {
                    // console.log(data);
                    window.imgurIntegration.imgurAlbumPictures = window.imgurIntegration.getImgurAlbumImagesByUploadDate(data.data);

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

        biketagImageTemplate: function (image, title) {
            var thumbnail = image.link.substr(0, image.link.length - 4) + 'l' + image.link.substr(-4);
            var tagNumber = '';
            var tagCredit = '';

            if (image.description) {
                var split = image.description.split(' ');
                tagNumber = split[0];
                tagCredit = split[split.length - 1];
            }

            // console.log('setting image link', image.link, image);
            return '<h2>' + title + '</h2>\
                    <a href="' + image.link + '" target="_blank">\
                        <span>' + tagNumber + '</span>\
                        <span>' + tagCredit + '</span>\
                        <img data-src="' + thumbnail + '">\
                    </a>';
        },

        showBikeTagNumber: function (number) {
            if (!window.imgurIntegration.imgurAlbumPictures) {
                return window.imgurIntegration.getImgurAlbumPictures(null, window.imgurIntegration.showBikeTagNumber);
            }

            var images = window.imgurIntegration.imgurAlbumPictures;
            number = Number.isInteger(number) ? Number.parseInt(number) : Number.parseInt(window.imgurIntegration.getUrlParam('tagnumber'));
            var realCount = (images.length / 2) + (images.length % 2);

            if (number && number < realCount) {
                var realTagNumber = images.length - (number * 2) + 1;
                var theTag = images[realTagNumber];
                var previousTag = images[realTagNumber + 1];

                $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(theTag, "Tag #" + number) );
                if (previousTag) {
                    $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(previousTag, "Proof for tag #" + (number - 1) ));
                }

                window.lazyLoadInstance = new LazyLoad();
            }
        },

        showLatestTagImages: function (count) {
            if (!window.imgurIntegration.imgurAlbumPictures) {
                return window.imgurIntegration.getImgurAlbumPictures(null, window.imgurIntegration.showLatestTagImages);
            }

            var images = window.imgurIntegration.imgurAlbumPictures;
            count = count || window.imgurIntegration.getUrlParam('count');
            $('.content .inner').empty();

            if (!count) {
                var lastImage = images[0];
                var secondToLastImage = images.length > 1 ? images[1] : null;
                var thirdToLastImage = images.length > 2 ? images[2] : null;
                var lastImageThumbnail = lastImage.link.substr(0, lastImage.link.length - 4) + 'l' + lastImage.link.substr(-4);

                $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(lastImage, "Tag You're It!") );
                if (secondToLastImage) {
                    $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(secondToLastImage, "Proof") );
                }
                if (thirdToLastImage) {
                    $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(thirdToLastImage, "Last tag") );
                }
            } else {
                count = count.toUpperCase() == "ALL" ? images.length : Number(count);
                for (var i = 0; (i < count) && (i < images.length); ++i) {
                    var image = images[i];
                    $('.content .inner').append( window.imgurIntegration.biketagImageTemplate(image, image.description) );
                }
            }

            // Set the form with the tag information
            var currentTagInfo = window.imgurIntegration.getCurrentTagInformation();
            $('#proofHeading').text('Proof for #' + currentTagInfo.currentTagNumber);
            // DON'T DO THIS RIGHT NOW
            // $('#nextTagHeading').text('Next Tag info (#' + currentTagInfo.nextTagNumber + ')');

            window.lazyLoadInstance = new LazyLoad();
            console.log('loading lazy load images', window.lazyLoadInstance);
        },

        uploadImageToImgur: function (image, description, next) {
            // Begin file upload
            console.log("Uploading file to Imgur..");

            var formData = new FormData();
            formData.append("image", image);
            formData.append("album", window.imgurIntegration.imgurAlbumHash);
            formData.append("description", description);

            var settings = {
                crossDomain: true,
                processData: false,
                contentType: false,
                data: formData,
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
                next();
            });
        },

        getImgurTokens: function (success) {
            var self = this;
            fetch('/auth/imgur/getToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) { return res.json() })
                .catch(function (error) { 
                    console.error('Error:', error) 
                })
                .then(function (response) {
                    var imgurTokens = response.imgurTokens;

                    if (imgurTokens && typeof imgurTokens == 'object') {
                        self.imgurAlbumHash = imgurTokens.imgurAlbumHash || self.imgurAlbumHash;
                        self.imgurAccessToken = imgurTokens.imgurAccessToken ? 'Bearer ' + imgurTokens.imgurAccessToken : self.imgurAccessToken;
                        self.imgurAuthorization = imgurTokens.imgurAuthorization ? 'Client-ID ' + imgurTokens.imgurAuthorization : self.imgurAuthorization;

                        return success(response);
                    }
                });
        },

        getUrlParam(param) {
            var searchParams = new URLSearchParams(window.location.search);

            if(!param) {
                return searchParams;
            } else {
                return searchParams.get(param);
            }
        },

        onUploadFormSubmit(theButton) {
            theButton.replaceWith('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');

            var form = $('#uploadForm');
            var fileInputs = form.find('input[type="file"]');
            var files = [], user = '', proofLocation = '';
    
            // get the latest tag number
            var currentTagInfo = window.imgurIntegration.getCurrentTagInformation();
            user = form.find('input[name="name"]').val();
            proofLocation = form.find('input[name="location"]').val();
            hint = form.find('input[name="hint"]').val();

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
    
            var locationString = proofLocation && proofLocation.length ? ' fount at ( ' + proofLocation + ' )' : '';
            var hintString = hint && hint.length ? ' (hint:  ' + hint + ' )' : '';
            var image1Description = '#' + currentTagInfo.currentTagNumber + ' proof' + locationString + ' by ' + user;
            var image2Description = '#' + currentTagInfo.nextTagNumber + ' tag' + hintString + ' by ' + user;

            window.imgurIntegration.uploadImageToImgur(files[0], image1Description, function() {
                window.imgurIntegration.uploadImageToImgur(files[1], image2Description, function() {
                    window.location.href = window.location.pathname + '?uploadSuccess=true';
                });
            });
        },

        init: function () {
            var self = this;
            
            this.getImgurTokens(function (response) {
                var count = self.getUrlParam('count');
                var tagnumber = self.getUrlParam('tagnumber');

                // If the page was reloaded with an upload success, show the upload successful dialogue in set the refresh frequency to 1s
                if (self.getUrlParam('uploadSuccess') == 'true') {
                    var wrapper = document.getElementById('wrapper');
                    var notification = document.createElement('div');
                    notification.id = 'notification';
                    notification.innerHTML = 'Your upload was successful! Please wait a few moments for the internet to catch up to you. <a class="close">[close]</a>';
                    wrapper.prepend(notification);

                    var close = $('#notification .close');
                    close.on('click', function() {
                        var notification = document.getElementById("notification");
                        notification.style.display = 'none';
                    });
                    self.imgurAlbumPicturesRefreshFrequency = 5000;
                }

                if(count) {
                    self.imgurAlbumPicturesRefreshFrequency = false;
                    self.showLatestTagImages(count);
                } else if(tagnumber) {
                    self.imgurAlbumPicturesRefreshFrequency = false;
                    self.showBikeTagNumber(tagnumber);
                } 
                
                if (self.imgurAlbumPicturesRefreshFrequency) {
                    setInterval(function() {
                        var logo = $('#header > div')[0];
                        logo.style.animation = 'none';
                        logo.offsetHeight; /* trigger reflow */
                        logo.style.animation = null;
                        
                        window.imgurIntegration.getImgurAlbumInfo(null, window.imgurIntegration.refreshImgurAlbumInfo);
                    }, self.imgurAlbumPicturesRefreshFrequency);
                }

                console.log('imgur integration initialized.');
            });

            $('#header > .logo').click(function (){
                document.getElementById('tagItButton').click();
            });

            $('form #submit').click(function (e) {
                e.preventDefault();
                self.onUploadFormSubmit($(e.currentTarget));
            });

            return self;
        }
    };

    window.imgurIntegration = imgurIntegration.init();
})(jQuery);