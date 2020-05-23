(function ($) {

    var redditIntegration = {
        subreddit: 'CyclePDX',
        redditAuthorization: '',
        redditAccessToken: null,
        redditPostComponent: 'RedditPost',

        buildRedditTextPosting: function (name, nextNumber, nextTag, lastTag, callback) {
            var data = {
                name: name,
                nextNumber: nextNumber,
                lastNumber: nextNumber - 1,
                nextTag: nextTag,
                lastTag: lastTag
            };

            data.component = window.redditIntegration.redditPostComponent;
            
            fetch('/views', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            }).then(function (res) {
                return res.text();
            }).then(function (response) {
                var container = $(response);
                callback(container.html());
            }).catch(function (error) { 
                console.error('Error:', error) 
            });
        },

        postToSubreddit: function (title, text, subreddit) {

            if (!subreddit) {
                subreddit = window.redditIntegration.subreddit;
            }

            var url = 'https://reddit.com/api/submit';

            var data = {
                title: title,
                text: text,
                sr: subreddit,
                kind: 'self'
            };
            // var formData = new FormData();
            // formData.append("title", title);
            // formData.append("text", text);
            // formData.append("sr", subreddit);
            // formData.append("kind", 'self');

            // var request = {
            //     crossDomain: true,
            //     processData: false,
            //     contentType: false,
            //     url: url,
            //     data: formData,
            //     type: 'POST',
            //     headers: {
            //         Authorization: window.redditIntegration.redditAccessToken,
            //         Accept: 'application/json',
            //     },
            //     beforeSend: function(request) {
            //         // request.setRequestHeader("User-Agent","web:biketag.org:v1");
            //     },
            //     mimeType: 'application/x-www-form-urlencoded'
            // };

            // $.ajax(request).done(function (response) {
            //     debugger;
            //     console.log(response);
            // });
            var request = {
                method: 'POST',
                body: JSON.stringify(data),
                crossDomain: true,
                mode: 'cors',
                headers: {
                    'Authorization': window.redditIntegration.redditAccessToken,
                    'Content-Type': 'application/json'
                }
            };
            fetch(url, request).then(function (res) { return res.json() })
                .catch(function (error) { 
                    console.error('Error:', error) 
                })
                .then(function (response) {
                    console.log('response', response);
                });

        },

        getRedditTokens: function (success) {
            var self = this;
            fetch('/auth/reddit/getToken', {
                method: 'POST',
                body: JSON.stringify({ hello: 'world' }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) { return res.json() })
                .catch(function (error) { 
                    console.error('Error:', error) 
                })
                .then(function (response) {
                    var redditTokens = response.redditTokens;

                    if (redditTokens && typeof redditTokens == 'object') {
                        self.subreddit = redditTokens.subreddit || self.subreddit;
                        self.redditAccessToken = redditTokens.redditAccessToken ? 'Bearer ' + redditTokens.redditAccessToken : self.redditAccessToken;
                        self.redditAuthorization = redditTokens.redditAuthorization ? 'Client-ID ' + redditTokens.redditAuthorization : self.redditAuthorization;

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
            
        },

        init: function () {
            var self = this;
            
            this.getRedditTokens(function (response) {
                console.log('reddit integration initialized.');
            });

            return self;
        }
    };

    window.redditIntegration = redditIntegration.init();
})(jQuery);