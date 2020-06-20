var poundSymbol = '<div class="normal-text">#</div>'

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
		var hr1 = document.createElement('hr')
		var hr2 = document.createElement('hr')
		var hr3 = document.createElement('hr')
		var second = document.createElement('div')
		var third = document.createElement('div')
		var fourth = document.createElement('div')
		var jameson = document.createElement('div')

		var submit = document.createElement('ul')

		var uploadBox = `<div class="upload-box">
			<i class="fa fa-icon fa-bicycle"></i>
			<i class="fa fa-icon fa-image"></i>
			<span></span>
		</div>`

		var proofPreview = `<div class="m-imgur-post hidden">
			<span class="close"></span>
			<img src="../../../assets/img/none.png">
			<h2 class="description"><span id="proofNumber"></span> found at (<span id="proofPreview"></span>) by <span id="namePreview"></span></h2>
		</div>`

		var nextPreview = `<div class="m-imgur-post hidden">
			<span class="close"></span>
			<img src="../../../assets/img/none.png">
			<h2 class="description"><span id="tagNumber"></span> tag (<span id="hintPreview"></span>) by <span id="namePreview"></span></h2>
		</div>`

		first.className = "field half first previousTag"
		second.className = "field half first"
		third.className = "field half nextTag"
		fourth.className = "field half"
		jameson.className = "field"
		submit.className = "actions"

		first.innerHTML = `<h3>Did you find the Mystery Location played in round</h3>
		<label for="currentTag">Your bike + Mystery Location</label>
		<input type="file" name="currentTag" class="hidden" required />
		${uploadBox}
		${proofPreview}`

		second.innerHTML = `<label for="location">Describe where the Mystery Location was found</label>
		<input type="text" name="location" placeholder="e.g. Cathedral Park, NE 42nd and Shaver, etc." />`

		third.innerHTML = `<h3>Play a new BikeTag Mystery Location to begin round</h3>
		<label for="nextTag">Your bike + new BikeTag</label>
		<input type="file" name="nextTag" class="hidden" required />
		${uploadBox}
		${nextPreview}`

		fourth.innerHTML = `<label for="hint">Provide a hint for the new Mystery Location</label>
		<input type="text" name="hint" placeholder="e.g. puns, riddles, rhymes, nearby landmarks, where historical events occurred" />`

		jameson.innerHTML = `<label for="name">Provide a Name</label>
		<input type="text" name="name" placeholder="e.g. Your Reddit (u/) or Instagram handle (@), nickname, team name, real name" />`

		submit.innerHTML = `<li><button id="submit">Play BikeTag!</button></li>`

		// form.appendChild(hr1)
		form.appendChild(first)
		form.appendChild(second)
		form.appendChild(hr2)
		form.appendChild(third)
		form.appendChild(fourth)
		form.appendChild(hr3)
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
		} catch (e) {
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

			if (image.description.indexOf('proof') !== -1) {
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
			var tagNumber = split[0].replace('#', poundSymbol)
			var split = image.description.split('by')
			var tagCredit = split[split.length - 1]
		}

		// console.log('setting image link', image.link, image);
		return '<a href="' + image.link + '" target="_blank">\
					<span>' + tagNumber + '</span>\
					<span>' + tagCredit + '</span>\
					<img data-src="' + thumbnail + '">\
					<h2 class="description">' + title + '</h2>\
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

	showImageThumbnail(event) {
		var target = event.target 
		var file = target.files[0]
		var fileReader = new FileReader()
		var uploadContainer = target.parentElement.querySelector('.upload-box')
		var previewContainer = target.parentElement.querySelector('.m-imgur-post')

		var changeToThumbnailImage = function(src, revoke = false) {
			var img = previewContainer.querySelector('img')
			var uploadFilenameSpan = uploadContainer.querySelector('span')

			previewContainer.classList.remove('hidden')
			uploadContainer.classList.add('hidden')

			uploadFilenameSpan.innerText = file.name
			img.src = src

			if (revoke) {
				URL.revokeObjectURL(url)
			}
		}
		var changeBackToUploader = function() {
			previewContainer.classList.add('hidden')
		}

		if (file.type.match('image')) {
			fileReader.onload = function () {
				changeToThumbnailImage(fileReader.result)
			}
			fileReader.readAsDataURL(file)
		} else {
			fileReader.onload = function () {
				var blob = new Blob([fileReader.result], {
					type: file.type
				})
				var url = URL.createObjectURL(blob)
				var video = document.createElement('video')
				
				var timeupdate = function () {
					if (snapImage()) {
						video.removeEventListener('timeupdate', timeupdate)
						video.pause()
					}
				}

				video.addEventListener('loadeddata', function () {
					if (snapImage()) {
						video.removeEventListener('timeupdate', timeupdate)
					}
				})

				var snapImage = function () {
					var canvas = document.createElement('canvas')
					canvas.width = video.videoWidth
					canvas.height = video.videoHeight
					canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
					var image = canvas.toDataURL()
					var success = image.length > 100000
					if (success) {
						changeToThumbnailImage(image, true)
					}
					return success
				}

				video.addEventListener('timeupdate', timeupdate)
				video.preload = 'metadata'
				video.src = url

				// Load video in Safari / IE11
				video.muted = true
				video.playsInline = true
				video.play()
			}

			fileReader.readAsArrayBuffer(file)
		}
	}

	showLatestTagImages(count) {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.showLatestTagImages.bind(this))
		}

		var images = imgur.imgurAlbumPictures;
		count = Number.isInteger(count) ? count : this.getUrlParam('count')

		if (!!images && images.length) {
			$('.content .inner').empty()
			if (!!count) {
				count = count.toUpperCase() == "ALL" ? images.length : Number(count);
				for (var i = 0;
					(i < (count * 2)) && (i < images.length); ++i) {
					var image = images[i]
					this.renderBikeTag(image, image.description)
				}
			} else {
				var lastImage = images[0]
				var secondToLastImage = images.length > 1 ? images[1] : null
				var thirdToLastImage = images.length > 2 ? images[2] : null

				this.renderBikeTag(lastImage, "Current mystery location to find")

				// Removed the multiple tags on the main page
				// if (secondToLastImage) {
				// 	this.renderBikeTag(secondToLastImage, "Proof image");
				// }
				// if (thirdToLastImage) {
				// 	this.renderBikeTag(thirdToLastImage, "Previous tag mystery location");
				// }
			}

			// Set the form with the tag information
			var currentTagInfo = this.getCurrentTagInformation()
			$('#proofHeading').html($('#proofHeading').text() + ' ' + poundSymbol + currentTagInfo.currentTagNumber + '?')
			$('#nextTagHeading').html($('#nextTagHeading').text() + ' ' + poundSymbol + currentTagInfo.nextTagNumber + ' here')
			$('#tagNumber').html(poundSymbol + currentTagInfo.nextTagNumber)
			$('#proofNumber').html(poundSymbol + currentTagInfo.currentTagNumber)
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

		this.appendBiketagForm(this.target)

		var form = document.querySelector(this.targetSelector)

		form.addEventListener('submit', function (e) {
			e.preventDefault()
			self.onUploadFormSubmit(e.currentTarget).bind(self)
		})

		form.querySelectorAll('input[type="file"]').forEach(function (fileInput) {
			fileInput.addEventListener('change', this.showImageThumbnail.bind(this))
		}.bind(this))

		var uploadBoxes = form.querySelectorAll('.upload-box')
		console.log({uploadBoxes})
		uploadBoxes.forEach(function(uploadBox) {
			uploadBox.addEventListener('click', function(event) {
				var parentElement = event.target.parentElement.parentElement
				var uploadFileInput = parentElement.querySelector('input[type="file"]')
				uploadFileInput.click()
			})
		})

		var inputChangedEvent = 'keyup'

		var locationInput = form.querySelector('input[name="location"]')
		locationInput.addEventListener(inputChangedEvent, function(event) {
			var target = event.target
			var text = target.value
			var preview = form.querySelector('#proofPreview')

			preview.innerText = text
		})

		var hintInput = form.querySelector('input[name="hint"]')
		hintInput.addEventListener(inputChangedEvent, function(event) {
			var target = event.target
			var text = target.value
			var preview = form.querySelector('#hintPreview')

			preview.innerText = text
		})

		var nameInput = form.querySelector('input[name="name"]')
		nameInput.addEventListener(inputChangedEvent, function(event) {
			var target = event.target
			var text = target.value
			var previews = form.querySelectorAll('#namePreview')

			previews.forEach(function(preview) {
				preview.innerText = text
			})
		})

		var deleteImageButtons = form.querySelectorAll('.m-imgur-post .close')
		deleteImageButtons.forEach(function(button) {
			button.addEventListener('click', function(event) {
				var previewContainer = event.target.parentElement
				var inputContainer = previewContainer.parentElement.querySelector('.upload-box')

				inputContainer.classList.remove('hidden')
				previewContainer.classList.add('hidden')
			})
		})
	}
}

window.biketag = new BikeTag()
window.biketag.BikeTag = BikeTag
