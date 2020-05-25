class BikeTag {
	constructor() {
		// Auto-Pickup?
		this.target = null
		this.targetSelector = 'form #submit'
		this.formID = "biketagUploadForm"
	}

	getUrlParam(param) {
		var searchParams = new URLSearchParams(window.location.search);

		if (!param) {
			return searchParams;
		} else {
			return searchParams.get(param);
		}
	}

	getLastOfUrlPath() {
		return window.location.href.split('/')[3]
	}

	getTagNumberFromURL(tagNumber) {
		if (!!tagNumber && Number.isInteger(tagNumber)) {
			return tagNumber
		}

		if (!Number.isInteger(tagNumber)) {
			var tagNumberFromQuery = Number.parseInt(this.getUrlParam('tagnumber'))
			var tagNumberFromPath = Number.parseInt(this.getLastOfUrlPath())

			return tagNumberFromPath || tagNumberFromQuery
		} else {
			tagNumber = Number.parseInt(tagNumber)
		}

		return tagNumber
	}

	appendBiketagForm(target) {
		target = target || this.target

		var form = document.createElement('form')
		form.id = this.formID
	
		var first = document.createElement('div')
		var second = document.createElement('div')
		var third = document.createElement('div')
		var fourth = document.createElement('div')
		var jameson = document.createElement('div')
	
		var submit = document.createElement('ul')
	
		first.className = "field half first"
		second.className = "field half first"
		third.className = "field half"
		fourth.className = "field half"
		jameson.className = "field"
		submit.className = "actions"
	
		first.innerHTML = `<h3 id="proofHeading">Proof Information</h3>
		<label for="currentTag">Image proof you found the mystery location</label>
		<input type="file" name="currentTag" />`
	
		second.innerHTML = `<label for="location">Location of the last tag:</label>
		<input type="text" name="location" placeholder="location" />`
	
		third.innerHTML = `<h3 id="nextTagHeading">Next Tag Info</h3>
		<label for="nextTag">Image of the next tag location</label>
		<input type="file" name="nextTag" />`
	
		fourth.innerHTML = `<label for="hint">Hint for the next tag location:</label>
		<input type="text" name="hint" placeholder="hint" />`
	
		jameson.innerHTML = `<label for="name">What do you go by?</label>
		<input type="text" name="name" placeholder="name" />`
	
		submit.innerHTML = `<li><button id="submit">Tag IT!</button></li>`
	
		form.appendChild(first)
		form.appendChild(second)
		form.appendChild(third)
		form.appendChild(fourth)
		form.appendChild(jameson)
		form.appendChild(submit)
	
		target.appendChild(form)
	}
	
	sendNotificationEmail(emailAddress, subject, body) {
		return Email.send({
			// Host: "smtp.gmail.com",
			// Username: "biketagorg",
			// Password: "BikeTagOrg720!",
			SecureToken: "1dc9bf22-d96c-46a6-86d7-1a3521d62781",
			To: emailAddress,
			From: "biketagorg@gmail.com",
			Subject: subject,
			Body: body,
			Port: 587,
		}).then(
			message => console.log(message)
		);
	}

	onUploadFormSubmit(formEl) {
		var self = this
		var theButton = formEl.querySelector('ul')
		theButton.innerHTML = `Please wait while your images are uploaded <i class="fa fa-spinner fa-spin" style="24px"></i>`

		try {
			var form = $(`#${this.formID}`)
			var fileInputs = form.find('input[type="file"]')
			var files = []
			var user = ''
			var proofLocation = ''

			// get the latest tag number
			var currentTagInfo = this.getCurrentTagInformation()
			var user = form.find('input[name="name"]').val()
			var proofLocation = form.find('input[name="location"]').val()
			var hint = form.find('input[name="hint"]').val()

			for (var i = 0; i < fileInputs.length; ++i) {
				var $files = fileInputs[i].files
				var $input = $(fileInputs[i])

				if ($files.length) {

					// Reject big files
					if ($files[0].size > $(this).data("max-size") * 1024) {
						console.log("Please select a smaller file")
						return false
					}

					files.push($files[0])
				} else {
					console.log('I need both files!')
					return
				}
			}

			var locationString = proofLocation && proofLocation.length ? ' found at ( ' + proofLocation + ' )' : ''
			var hintString = hint && hint.length ? ' (hint:  ' + hint + ' )' : ''
			var image1Description = '#' + currentTagInfo.currentTagNumber + ' proof' + locationString + ' by ' + user
			var image2Description = '#' + currentTagInfo.nextTagNumber + ' tag' + hintString + ' by ' + user

			imgur.uploadImageToImgur(files[0], image1Description, function () {
				imgur.uploadImageToImgur(files[1], image2Description, function () {
					var emailPromises = []

					biketag.config.adminEmailAddresses.forEach(function (emailAddress) {
						const subject = "New Bike Tag Post (#" + currentTagInfo.nextTagNumber + ")"
						const body = "Hello BikeTag Admin, A new post has been created!\r\nTo post this tag to Reddit manually, go to " + window.location.host + "/get/reddit to get the reddit post template.\r\n\r\nYou are getting this email because you are listed as an admin on the site (" + window.location.host + "). Reply to this email to request to be removed from this admin list."
						emailPromises.push(self.sendNotificationEmail(emailAddress, subject, body))
					})

					Promise.all(emailPromises).then(function () {
						window.location.href = window.location.pathname + '?uploadSuccess=true'
					})

				})
			})
		} catch(e) {
			console.error(e)
			formEl.innerHTML = `<h3>Error</h3><p>Your tag could not be posted. :(</p><p>If this issue persists, please reach out to <a href="hello@biketag.org">hello@biketag.org</a> for help.</p>`
		}
	}

	getTagNumberIndex(tagNumber) {
		var images = imgur.imgurAlbumPictures;
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
	}

	getProofTagNumberIndex(tagNumber) {
		var images = imgur.imgurAlbumPictures;
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
	}

	renderBikeTag(tag, heading, targetSelector) {
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
	}

	getBikeTagNumberFromImage(image) {
		let tagNumber

		if (image.description) {
			var split = image.description.split(' ')
			tagNumber = Number.parseInt(split[0].substring(1))

			if(image.description.indexOf('proof') !== -1) {
				tagNumber = 0 - tagNumber
			}
		}

		return tagNumber
	}

	biketagImageTemplate(image, title) {
		var imageLinkStringSplit = image.link.split('.')
		var imageLinkStringEnd = '.' + imageLinkStringSplit[imageLinkStringSplit.length - 1]
		var thumbnail = image.link.replace(imageLinkStringEnd, 'l' + imageLinkStringEnd)
		var tagNumber = '';

		if (image.gifv) {
			thumbnail = image.link;
		}

		if (image.description) {
			var split = image.description.split(' ')
			var tagNumber = split[0]
			var split = image.description.split('by')
			var tagCredit = split[split.length - 1]
		}

		// console.log('setting image link', image.link, image);
		return '<h2>' + title + '</h2>\
				<a href="' + image.link + '" target="_blank">\
					<span>' + tagNumber + '</span>\
					<span>' + tagCredit + '</span>\
					<img data-src="' + thumbnail + '">\
				</a>';
	}

	getCurrentTagInformation() {
		var tagInformation = {
			currentTagNumber: 0,
			hasTag: false,
			currentTag: null,
		};

		if (imgur.imgurAlbumPictures.length) {
			tagInformation.currentTag = imgur.imgurAlbumPictures[0];

			if (tagInformation.currentTag) {
				tagInformation.hasTag = true;
				tagInformation.currentTagNumber = Number(tagInformation.currentTag.description.split(' ')[0].substr(1));
			}
		}

		tagInformation.nextTagNumber = tagInformation.currentTagNumber + 1;

		return tagInformation;
	}

	showLatestTagImages(count) {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.showLatestTagImages.bind(this));
		}

		var images = imgur.imgurAlbumPictures;
		count = Number.isInteger(count) ? count : this.getUrlParam('count');

		if ((images && images.length > 1)) {
			$('.content .inner').empty();
			if (!!count) {
				count = count.toUpperCase() == "ALL" ? images.length : Number(count);
				for (var i = 0;
					(i < (count * 2)) && (i < images.length); ++i) {
					var image = images[i];
					this.renderBikeTag(image, image.description);
				}
			} else {
				var lastImage = images[0];
				var secondToLastImage = images.length > 1 ? images[1] : null;
				var thirdToLastImage = images.length > 2 ? images[2] : null;

				this.renderBikeTag(lastImage, "Current mystery location to find");

				// Removed the multiple tags on the main page
				// if (secondToLastImage) {
				// 	this.renderBikeTag(secondToLastImage, "Proof image");
				// }
				// if (thirdToLastImage) {
				// 	this.renderBikeTag(thirdToLastImage, "Previous tag mystery location");
				// }
			}

			// Set the form with the tag information
			var currentTagInfo = this.getCurrentTagInformation();
			$('#proofHeading').text('Proof for #' + currentTagInfo.currentTagNumber);
			$('#nextTagHeading').text('Next Tag (#' + currentTagInfo.nextTagNumber + ')');
		}

		// DON'T DO THIS RIGHT NOW
		// $('#nextTagHeading').text('Next Tag info (#' + currentTagInfo.nextTagNumber + ')');

		console.log('loading lazy load images');
		window.lazyLoadInstance = new LazyLoad();

		setTimeout(function () {
			// Hide the overlay and show the content
			$('#loader .logo').animate({
				top: "-200px"
			});
			$('#loader').fadeOut();
			$('#main').fadeIn();
		}, 1000);
	}

	showBikeTagNumber(tagNumber) {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.showBikeTagNumber.bind(this));
		}

		tagNumber = this.getTagNumberFromURL(tagNumber)
		var images = imgur.imgurAlbumPictures
		var imageCount = Math.round((images.length / 2) + ((images.length - 1) % 2))

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
	}

	init(targetSelector) {

		var self = this
		this.targetSelector = targetSelector
		this.target = document.querySelector(this.targetSelector)

		this.appendBiketagForm(this. target)

		var form = document.querySelector(this.targetSelector)
		
		form.addEventListener('submit', function (e) {
			e.preventDefault()
			self.onUploadFormSubmit(e.currentTarget).bind(self)
		})

	}
}

window.biketag = new BikeTag()
window.biketag.BikeTag = BikeTag
