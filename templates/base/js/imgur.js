;(function () {
    class imgur {
        constructor() {
            this.imgurAccessToken = null
            this.imgurAlbumPictures = null
            // this.imgurAlbumPicturesRefreshFrequency = 60000
            this.imgurPostComponent = 'ImgurPost'

            if (window.pageData && window.pageData.imgur) {
                this.albumHash = window.pageData.imgur.albumHash
                this.imgurClientID = window.pageData.imgur.imgurClientID
                this.imgurAuthorization = !window.pageData.imgur.imgurAuthorization
                    ? 'Client-ID ' + this.imgurClientID
                    : window.pageData.imgur.imgurAuthorization
            }

            this.init()
        }

        getImgurAlbumInfo(albumHash, callback) {
            if (!albumHash) {
                albumHash = this.albumHash
            }

            if (!albumHash) {
                return console.log('imgur album hash not set')
            }

            var url = 'https://api.imgur.com/3/album/' + albumHash + '/'

            const headers = new Headers()
            headers.append('Authorization', this.imgurAccessToken || this.imgurAuthorization)
            headers.append('Accept', 'application/json')
            fetch(url, {
                method: 'GET',
                headers,
                cors: true,
                cache: 'no-cache',
            })
                .then((r) => r.json())
                .then((data) => {
                    console.log(data)

                    if (callback) {
                        callback(data)
                    }
                })
                .catch((err) => {
                    console.log('error getting images from imgur', err)
                })
        }

        refreshImgurAlbumInfo(albumInfo) {
            if (albumInfo && albumInfo.data) {
                albumInfo = albumInfo.data
            } else {
                return
            }

            if (albumInfo.images_count != window.imgur.imgurAlbumPictures.length) {
                console.log('image count has changed, updating most recent tags')
                /// TODO: Fix a bug at this line
                this.imgurAlbumPictures = this.getImgurAlbumImagesByTagNumber(albumInfo.images)
            }
        }

        getImgurAlbumImagesByTagNumber(images = []) {
            return images.sort(function (image1, image2) {
                var tagNumber1 = biketag.getBikeTagNumberFromImage(image1)
                var tagNumber2 = biketag.getBikeTagNumberFromImage(image2)

                var tagNumber1IsProof = tagNumber1 < 0
                var tagNumber2IsProof = tagNumber2 < 0
                var difference = Math.abs(tagNumber2) - Math.abs(tagNumber1)
                var sortResult = difference !== 0 ? difference : tagNumber1IsProof ? -1 : 1

                return sortResult
            })
        }

        getImgurAlbumImagesByUploadDate(images = [], newestFirst) {
            if (!newestFirst) {
                return images.sort(function (image1, image2) {
                    return new Date(image2.datetime) - new Date(image1.datetime)
                })
            } else {
                return images.sort(function (image1, image2) {
                    return new Date(image1.datetime) - new Date(image2.datetime)
                })
            }
        }

        getImgurAlbumPictures(albumHash, callback) {
            if (!albumHash) {
                albumHash = this.albumHash
            }

            if (!albumHash) {
                return console.log('imgur album hash not set')
            }

            var url = 'https://api.imgur.com/3/album/' + albumHash + '/images/'

            const headers = new Headers()
            headers.append('Authorization', this.imgurAccessToken || this.imgurAuthorization)
            headers.append('Accept', 'application/json')

            fetch(url, {
                method: 'GET',
                headers,
                cors: true,
                cache: 'no-cache',
            })
                .then((r) => r.json())
                .then((data) => {
                    console.log(data)
                    this.imgurAlbumPictures = this.getImgurAlbumImagesByTagNumber(data.data)

                    if (callback) {
                        callback(data)
                    }
                })
                .catch((err) => {
                    console.log('error getting images from imgur', {
                        albumHash,
                        imgurApiError: err,
                    })
                })
        }

        uploadImageToImgur(image, description, next) {
            // Begin file upload
            console.log('Uploading file to Imgur..')

            var formData = new FormData()
            formData.append('image', image)
            formData.append('album', this.albumHash)
            formData.append('description', description)

            // const headers = new Headers()
            // headers.append('Content-Type', 'multipart/form-data')
            // headers.append('Authorization', this.imgurAccessToken)
            // headers.append('Accept', 'application/json')

            // fetch('https://api.imgur.com/3/image/', {
            //     method: 'POST',
            //     headers,
            // 	body: formData,
            // 	// credentials: 'include',
            //     cors: true,
            // })
            //     .then((r) => r.json())
            //     .then((data) => {
            //         console.log({ uploadResponse: data })
            //         next()
            //     })
            // 	.catch((err) => console.error)
            var settings = {
                crossDomain: true,
                processData: false,
                contentType: false,
                data: formData,
                withCredentials: true,
                type: 'POST',
                url: 'https://api.imgur.com/3/image',
                headers: {
                    Authorization: this.imgurAccessToken,
                    Accept: 'application/json',
                },
                mimeType: 'multipart/form-data',
            }

            // Response contains stringified JSON
            // Image URL available at response.data.link
            $.ajax(settings).done(function (response) {
                next()
            })
        }

        getImgurTokens(done) {
            var url = '/auth/imgur/getToken/'
            fetch(url, {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
                .then((res) => {
                    return res.json()
                })
                .then((response) => {
                    if (!!response && typeof response == 'object') {
                        this.albumHash = response.albumHash || this.albumHash
                        this.imgurAccessToken = response.imgurAccessToken
                            ? 'Bearer ' + response.imgurAccessToken
                            : this.imgurAccessToken
                        this.imgurAuthorization = response.imgurAuthorization
                            ? 'Client-ID ' + response.imgurAuthorization
                            : this.imgurAuthorization
                    } else {
                        console.log('invalid imgur getToken response', { response, url })
                    }

                    done(response)
                })
        }

        getUrlParam(param) {
            var searchParams = new URLSearchParams(window.location.search)

            if (!param) {
                return searchParams
            } else {
                return searchParams.get(param)
            }
        }

        init() {
            const self = this

            this.getImgurTokens((response) => {
                var count = this.getUrlParam('count')
                var tagnumber = biketag.getTagNumberFromURL()
                var isArchive = biketag.getLastOfUrlPath().toLowerCase().indexOf('archive') !== -1

                // console.log({getImgurTokens: response})
                this.albumHash = response.albumHash || this.albumHash
                this.imgurAuthorization = response.imgurAuthorization || this.imgurAuthorization

                // if (!this.albumHash || !this.imgurAuthorization) return

                // If the page was reloaded with an upload success, show the upload successful dialogue in set the refresh frequency to 1s
                if (this.getUrlParam('uploadSuccess') == 'true') {
                    var wrapper = document.getElementById('wrapper')
                    var notification = document.createElement('div')
                    notification.id = 'notification'
                    notification.innerHTML =
                        'Your upload was successful! Please wait a few moments for the internet to catch up to you. <a class="close">[close]</a>'
                    wrapper.prepend(notification)

                    var close = document.querySelector('#notification .close')
                    if (close) {
                        close.addEventListener('click', function () {
                            var notification = document.getElementById('notification')
                            notification.style.display = 'none'
                        })
                    }
                    // this.imgurAlbumPicturesRefreshFrequency = 5000;
                }

                if (count) {
                    this.imgurAlbumPicturesRefreshFrequency = false
                    biketag.showCurrentBikeTag(count)
                } else if (isArchive) {
                    biketag.showCurrentBikeTag(count || 10)
                } else if (tagnumber) {
                    this.imgurAlbumPicturesRefreshFrequency = false
                    biketag.showBikeTagNumber(tagnumber)
                } else {
                    // biketag.showCurrentBikeTag()
                }

                if (this.imgurAlbumPicturesRefreshFrequency) {
                    setInterval(() => {
                        var logo = document.querySelector('#header .header--logo')
                        if (logo) {
                            logo.attributes.style.animation = 'none'
                            logo.offsetHeight /* trigger reflow */
                            logo.attributes.style.animation = null
                        }

                        this.getImgurAlbumInfo(
                            this.albumHash,
                            this.refreshImgurAlbumInfo.bind(this),
                        )
                    }, this.imgurAlbumPicturesRefreshFrequency)
                }

                console.log('imgur integration initialized.')
                console.log('loading lazy load images')
            })

            return this
        }
    }

    window.imgur = new imgur()
})()
