(function($) {
    var imgurAlbumHash = '3OMZJ6a';
    var imgurAuthorization = 'Client-ID 79ea70333c45883';

    function showLatestTagImages()  {
        $.ajax({
            url: 'https://api.imgur.com/3/album/' + imgurAlbumHash + '/images',
            success: function(data) {
                console.log(data);
                var images = data.data;
                var lastImage = images[images.length - 1];
                var secondToLastImage = images.length > 1 ? images[images.length - 2] : null;

                $('.content .inner').append( $('<img src="' + lastImage.link + '">') );
                if(secondToLastImage) {
                    $('.content .inner').append( $('<img src="' + secondToLastImage.link + '">') );
                }
            },
            error: function(err) {
                console.log('error getting images from imgur', err);
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", imgurAuthorization);
            },
        });
    }

    window.showLatestTagImages = showLatestTagImages;
})(jQuery);