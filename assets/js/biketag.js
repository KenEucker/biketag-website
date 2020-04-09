(function ($) {

	var biketag = {
		fallbackCdnUrl: 'https://pdxbiketag.s3-us-west-2.amazonaws.com/biketag/',
		fallbackLocalUrl: 'biketag/',

		getCurrentTagInformation() {
			var tagInformation = {
				currentTagNumber: 0,
				hasTag: false,
				currentTag: null,
			};

			if (this.imgurAlbumPictures.length) {
				tagInformation.currentTag = this.imgurAlbumPictures[0];

				if (tagInformation.currentTag) {
					tagInformation.hasTag = true;
					tagInformation.currentTagNumber = Number(tagInformation.currentTag.description.split(' ')[0].substr(1));
				}
			}

			tagInformation.nextTagNumber = tagInformation.currentTagNumber + 1;

			return tagInformation;
		},

		refreshImgurAlbumInfo: function (albumInfo) {
			if (albumInfo && albumInfo.data) {
				albumInfo = albumInfo.data;
			} else {
				return;
			}

			if (albumInfo.images_count != this.imgurAlbumPictures.length) {
				console.log('image count has changed, updating most recent tags');
				this.imgurAlbumPictures = this.getImagesByUploadDate(albumInfo.images);
				this.showLatestTagImages();
			}
		},

		getImagesByUploadDate: function (images, newestFirst) {
			if (!newestFirst) {
				return images.sort(function (image1, image2) {
					return new Date(image2.datetime) - new Date(image1.datetime);
				});
			} else {
				return images.sort(function (image1, image2) {
					return new Date(image1.datetime) - new Date(image2.datetime);
				});
			}
		},

		getPictures: function (albumHash, callback) {
			if (!albumHash) {
				albumHash = this.imgurAlbumHash;
			}
			$.ajax({
				url: 'https://api.imgur.com/3/album/' + albumHash + '/images',
				success: function (data) {
					// console.log(data);
					this.imgurAlbumPictures = this.getImgurAlbumImagesByUploadDate(data.data);

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

		biketagImageTemplate: function (image, title) {
			var thumbnail = image.link.substr(0, image.link.length - 4) + 'l' + image.link.substr(-4);
			var tagNumber = '';

			if (image.gifv) {
				thumbnail = image.link;
			}

			if (image.description) {
				var split = image.description.split(' ');
				tagNumber = split[0];
				split = image.description.split('by');
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

		renderBikeTag: function (tag, heading, targetSelector) {
			var targetContainer = document.querySelector(targetSelector || '.content .inner');

			if (targetContainer) {
				var tagContainer = document.createElement('div');
				tagContainer.className = "m-imgur-post";
				tagContainer.innerHTML = this.biketagImageTemplate(tag, heading || "Tag");
				tagContainer.querySelector('a').addEventListener('click', function (e) {

					if (window.uglipop) {
						e.preventDefault();
						e.stopPropagation();

						window.uglipop({
							source: 'html',
							content: '<img src="' + this.getAttribute('href') + '"></img>'
						});
					}
				});
				targetContainer.appendChild(tagContainer);
			}
		},

		getTagNumberIndex: function (tagNumber) {
			var images = this.imgurAlbumPictures;
			var tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

			var verifyTagNumber = function (index) {
				return index > -1 ? images[index].description.indexOf('#' + tagNumber + ' tag') != -1 : -1
			};
			if (verifyTagNumber(tagNumberIndex)) {
				return tagNumberIndex;
			} else if (tagNumberIndex < (images.length + 1) && verifyTagNumber(tagNumberIndex + 1)) {
				return tagNumberIndex + 1;
			} else if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
				return tagNumberIndex - 1;
			}

			for (var i = 0; i < images.length; ++i) {
				if (verifyTagNumber(i)) {
					tagNumberIndex = i;
				}
			}

			return tagNumberIndex;
		},

		getProofTagNumberIndex: function (tagNumber) {
			var images = this.imgurAlbumPictures;
			var tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

			var verifyProofTagNumber = function (index) {
				return images[index].description.indexOf('#' + tagNumber + ' proof') != -1
			};
			if (verifyProofTagNumber(tagNumberIndex)) {
				return tagNumberIndex;
			} else if ((tagNumberIndex + 1 < images.length) && verifyProofTagNumber(tagNumberIndex + 1)) {
				return tagNumberIndex + 1;
			} else if (tagNumberIndex > 0 && verifyProofTagNumber(tagNumberIndex - 1)) {
				return tagNumberIndex - 1;
			}

			for (var i = 0; i < images.length; ++i) {
				console.log(`looking for ${tagNumber} with ${i}`);
				if (verifyProofTagNumber(i)) {
					tagNumberIndex = i;
				}
			}

			return tagNumberIndex;
		},

		showBikeTagNumber: function (tagNumber) {
			if (!this.imgurAlbumPictures) {
				return this.getPictures(null, this.showBikeTagNumber.bind(this));
			}

			var images = this.imgurAlbumPictures;
			tagNumber = Number.isInteger(tagNumber) ? Number.parseInt(tagNumber) : Number.parseInt(this.getUrlParam('tagnumber')) || 1;
			var imageCount = Math.round((images.length / 2) + ((images.length - 1) % 2));

			if (tagNumber && tagNumber < imageCount) {
				var theTag = images[this.getTagNumberIndex(tagNumber)];
				var proofTag = images[this.getProofTagNumberIndex(tagNumber)];

				if (proofTag) {
					this.renderBikeTag(proofTag, "Found It Tag");
				}
				if (theTag) {
					this.renderBikeTag(theTag, "Original Tag");
				}

				window.lazyLoadInstance = new LazyLoad();
			} else if (tagNumber == imageCount) {
				var newTag = images[this.getTagNumberIndex(tagNumber)];

				this.renderBikeTag(newTag, "Current Tag");

				window.lazyLoadInstance = new LazyLoad();
			}
		},

		showLatestTagImages: function (count) {
			if (!this.imgurAlbumPictures) {
				return this.getPictures(null, this.showLatestTagImages.bind(this));
			}

			var images = this.imgurAlbumPictures;
			count = Number.isInteger(count) ? count : this.getUrlParam('count');
			$('.content .inner').empty();

			if (!count) {
				var lastImage = images[0];
				var secondToLastImage = images.length > 1 ? images[1] : null;
				var thirdToLastImage = images.length > 2 ? images[2] : null;

				this.renderBikeTag(lastImage, "Tag You're It!");
				if (secondToLastImage) {
					this.renderBikeTag(secondToLastImage, "Proof");
				}
				if (thirdToLastImage) {
					this.renderBikeTag(thirdToLastImage, "Last tag");
				}
			} else {
				count = count.toUpperCase() == "ALL" ? images.length : Number(count);
				for (var i = 0;
					(i < count) && (i < images.length); ++i) {
					var image = images[i];
					this.renderBikeTag(image, image.description);
				}
			}

			// Set the form with the tag information
			var currentTagInfo = this.getCurrentTagInformation();
			$('#proofHeading').text('Proof for #' + currentTagInfo.currentTagNumber);
			$('#nextTagHeading').text('Next Tag info (#' + currentTagInfo.nextTagNumber + ')');

			window.lazyLoadInstance = new LazyLoad();
			console.log('loading lazy load images', window.lazyLoadInstance);
		},

		buildBiketagImage: function (target, image, title) {
			if (!$(target).length) {
				// Can't add it to nothing
				return;
			}

			var data = {
				thumbnail: image.link.substr(0, image.link.length - 4) + 'l' + image.link.substr(-4),
				imageLink: image.link,
				tagNumber: '',
				tagCredit: '',
				title: title
			}

			if (image.description) {
				var split = image.description.split(' ');
				data.tagNumber = split[0];
				data.tagCredit = split[split.length - 1];
			}

			data.component = this.imgurPostComponent;

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
				$(target).append(container.html());
				window.lazyLoadInstance = new LazyLoad();
			}).catch(function (error) {
				console.error('Error:', error)
			});
		},

		uploadImage: function (image, description, next) {
			// Upload to imgur
			// Upload to local
			// Upload to s3
		},

		getUrlParam(param) {
			var searchParams = new URLSearchParams(window.location.search);

			if (!param) {
				return searchParams;
			} else {
				return searchParams.get(param);
			}
		},

		onUploadFormSubmit(theButton) {
			theButton.replaceWith('<i class="fa fa-spinner fa-spin" style="font-size:24px"></i>');

			var form = $('#uploadForm');
			var fileInputs = form.find('input[type="file"]');
			var files = [],
				user = '',
				proofLocation = '';

			// get the latest tag number
			var currentTagInfo = this.getCurrentTagInformation();
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

			var locationString = proofLocation && proofLocation.length ? ' found at ( ' + proofLocation + ' )' : '';
			var hintString = hint && hint.length ? ' (hint:  ' + hint + ' )' : '';
			var image1Description = '#' + currentTagInfo.currentTagNumber + ' proof' + locationString + ' by ' + user;
			var image2Description = '#' + currentTagInfo.nextTagNumber + ' tag' + hintString + ' by ' + user;

			this.uploadImageToImgur(files[0], image1Description, function () {
				this.uploadImageToImgur(files[1], image2Description, function () {
					window.location.href = window.location.pathname + '?uploadSuccess=true';
				});
			}.bind(this));
		},

		init: function () {
			var self = this;

			// $('#header > .logo').click(function () {
			// 	document.getElementById('tagItButton').click();
			// });

			// $('form #submit').click(function (e) {
			// 	e.preventDefault();
			// 	self.onUploadFormSubmit($(e.currentTarget).bind(self));
			// });

			return self;
		}
	};

	window.biketag = biketag.init();
})(jQuery);
