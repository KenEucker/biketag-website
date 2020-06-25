(function ($) {

	var imgur = {

		imgurAccessToken: null,
		imgurAlbumPictures: null,
		imgurAlbumPicturesRefreshFrequency: 60000,
		imgurPostComponent: 'ImgurPost',
		adminEmailAddresses: window.biketag.config.adminEmailAddresses || [],
		
		getImgurAlbumInfo(albumHash, callback) {
			if (!albumHash) {
				albumHash = this.imgurAlbumHash;
			}

			if (!albumHash) {
				return console.log('imgur album hash not set')
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
					xhr.setRequestHeader("Authorization", this.imgurAuthorization);
				}.bind(this),
			});
		},

		refreshImgurAlbumInfo(albumInfo) {
			if (albumInfo && albumInfo.data) {
				albumInfo = albumInfo.data;
			} else {
				return;
			}

			if (albumInfo.images_count != window.imgur.imgurAlbumPictures.length) {
				console.log('image count has changed, updating most recent tags');
				this.imgurAlbumPictures = this.getImgurAlbumImagesByTagNumber(albumInfo.images);
				biketag.showLatestTagImages()
			}
		},

		getImgurAlbumImagesByTagNumber(images) {
			return images.sort(function (image1, image2) {
				var tagNumber1 = biketag.getBikeTagNumberFromImage(image1)
				var tagNumber2 = biketag.getBikeTagNumberFromImage(image2)

				var tagNumber1IsProof = tagNumber1 < 0
				var tagNumber2IsProof = tagNumber2 < 0
				var difference = Math.abs(tagNumber2) - Math.abs(tagNumber1)
				var sortResult = difference !== 0 ? difference : (tagNumber1IsProof ? -1 : 1)

				return sortResult
			})
		},

		getImgurAlbumImagesByUploadDate(images, newestFirst) {
			if (!newestFirst) {
				return images.sort(function (image1, image2) {
					return new Date(image2.datetime) - new Date(image1.datetime)
				})
			} else {
				return images.sort(function (image1, image2) {
					return new Date(image1.datetime) - new Date(image2.datetime)
				})
			}
		},

		getImgurAlbumPictures(albumHash, callback) {
			if (!albumHash) {
				albumHash = this.imgurAlbumHash;
			}

			if (!albumHash) {
				return console.log('imgur album hash not set')
			}

			$.ajax({
				url: 'https://api.imgur.com/3/album/' + albumHash + '/images',
				success: function (data) {
					// console.log(data);
					this.imgurAlbumPictures = this.getImgurAlbumImagesByTagNumber(data.data);

					if (callback) {
						callback(data);
					}
				}.bind(this),
				error: function (err) {
					console.log('error getting images from imgur', err);
				},
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", this.imgurAuthorization);
				}.bind(this),
			});
		},
		
		uploadImageToImgur(image, description, next) {
			// Begin file upload
			console.log("Uploading file to Imgur..");

			var formData = new FormData();
			formData.append("image", image);
			formData.append("album", this.imgurAlbumHash);
			formData.append("description", description);

			var settings = {
				crossDomain: true,
				processData: false,
				contentType: false,
				data: formData,
				type: 'POST',
				url: 'https://api.imgur.com/3/image',
				headers: {
					Authorization: this.imgurAccessToken,
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

		getImgurTokens(done) {
			var self = this;
			fetch('/auth/imgur/getToken', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				}).then(function (res) {
					return res.json()
				})
				// .catch(function (error) {
				// 	console.error('Error:', error)
				// })
				.then(function (response) {
					if (!!response && typeof response == 'object') {
						self.imgurAlbumHash = response.imgurAlbumHash || self.imgurAlbumHash
						self.imgurAccessToken = response.imgurAccessToken ? 'Bearer ' + response.imgurAccessToken : self.imgurAccessToken
						self.imgurAuthorization = response.imgurAuthorization ? 'Client-ID ' + response.imgurAuthorization : self.imgurAuthorization
					}

					done(response);
				});
		},

		getUrlParam(param) {
			var searchParams = new URLSearchParams(window.location.search);

			if (!param) {
				return searchParams;
			} else {
				return searchParams.get(param);
			}
		},

		init() {
			var self = this;

			$('#main').hide();

			this.getImgurTokens(function (response) {
				var count = self.getUrlParam('count')
				var tagnumber = biketag.getTagNumberFromURL()

				console.log({getImgurTokens: response})
				self.imgurAlbumHash = response.imgurAlbumHash
				self.imgurAuthorization = response.imgurAuthorization

				// If the page was reloaded with an upload success, show the upload successful dialogue in set the refresh frequency to 1s
				if (self.getUrlParam('uploadSuccess') == 'true') {
					var wrapper = document.getElementById('wrapper');
					var notification = document.createElement('div');
					notification.id = 'notification';
					notification.innerHTML = 'Your upload was successful! Please wait a few moments for the internet to catch up to you. <a class="close">[close]</a>';
					wrapper.prepend(notification);

					var close = $('#notification .close');
					close.on('click', function () {
						var notification = document.getElementById("notification");
						notification.style.display = 'none';
					});
					self.imgurAlbumPicturesRefreshFrequency = 5000;
				}

				if (count) {
					self.imgurAlbumPicturesRefreshFrequency = false
					biketag.showLatestTagImages(count)
					document.body.classList.add('archive')
				} else if (tagnumber) {
					self.imgurAlbumPicturesRefreshFrequency = false
					biketag.showBikeTagNumber(tagnumber)
				} else {
					biketag.showLatestTagImages()
				}

				if (self.imgurAlbumPicturesRefreshFrequency) {
					setInterval(function () {
						var logo = $('#header > div')[0];
						logo.style.animation = 'none';
						logo.offsetHeight; /* trigger reflow */
						logo.style.animation = null;

						self.getImgurAlbumInfo(null, self.refreshImgurAlbumInfo);
					}, self.imgurAlbumPicturesRefreshFrequency);
				}

				console.log('imgur integration initialized.');
			});

			return self;
		}
	};

	window.imgur = imgur.init();
})(jQuery);
