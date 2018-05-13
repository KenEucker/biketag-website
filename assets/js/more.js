(function($) {

    var imgurIntegration = {
        imgurAlbumHash: '3OMZJ6a',
        imgurAuthorization: 'Client-ID 79ea70333c45883',
        imgurAlbumPictures: null,

        getImgurAlbumPictures: function(hash, callback)  {
            if (!hash) {
                hash = this.imgurAlbumHash;
            }
            $.ajax({
                url: 'https://api.imgur.com/3/album/' + hash + '/images',
                success: function(data) {
                    console.log(data);
                    window.imgurIntegration.imgurAlbumPictures = data.data;

                    if (callback) {
                        callback(data);
                    }
                },
                error: function(err) {
                    console.log('error getting images from imgur', err);
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("Authorization", window.imgurIntegration.imgurAuthorization);
                },
            });
        },

        showLatestTagImages: function() {
            if (!window.imgurIntegration.imgurAlbumPictures) {
                window.imgurIntegration.getImgurAlbumPictures(null, window.imgurIntegration.showLatestTagImages);
            }

            var images = window.imgurIntegration.imgurAlbumPictures;
            var lastImage = images[images.length - 1];
            var secondToLastImage = images.length > 1 ? images[images.length - 2] : null;

            $('.content .inner').append( $('<img src="' + lastImage.link + '">') );
            if(secondToLastImage) {
                $('.content .inner').append( $('<img src="' + secondToLastImage.link + '">') );
            }
        }
    };

    window.imgurIntegration = imgurIntegration;
})(jQuery);