var poundSymbol = '<div class="normal-text">#</div>'

class BikeTag {
	constructor() {
		// Auto-Pickup?
		this.target = null
		this.targetSelector = 'form #submit'
		this.formID = "biketagUploadForm"
	}

	closeNotification() {
		var notification = document.getElementById("notification")
		if (notification) {
			$(notification).fadeOut()
			// notification.style.display = 'none'
		}
	}

	createNotification(message, color, expire = 3000) {
		var wrapper = document.getElementById('wrapper');
		var notification = document.createElement('div');
		notification.id = 'notification';
		notification.className = color 
		notification.innerHTML = `${message} <a class="close">close</a>`;
		wrapper.prepend(notification);


		var close = document.querySelector('#notification .close')
		close.addEventListener('click', this.closeNotification)

		window.setTimeout(this.closeNotification, expire)

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

		var heading = document.createElement('div')
		var hr1 = document.createElement('hr')
		var first = document.createElement('div')
		var hr2 = document.createElement('hr')
		var second = document.createElement('div')
		var third = document.createElement('div')
		var hr3 = document.createElement('hr')
		var fourth = document.createElement('div')
		var jameson = document.createElement('div')

		var submit = document.createElement('ul')

		window.pageData = !!window.pageData ? window.pageData : {}

		window.pageData.newBikeTagMessage = window.pageData.newBikeTagMessage ? window.pageData.newBikeTagMessage : 'Did you find the Mystery Location played in round'
		window.pageData.proofTagMessage = window.pageData.proofTagMessage ? window.pageData.proofTagMessage : 'BikeTag @ matching Mystery Location'
		window.pageData.proofTagTitle = window.pageData.proofTagTitle ? window.pageData.proofTagTitle : 'Play a BikeTag that matches the Biketag in round'
		window.pageData.nextTagMessage = window.pageData.nextTagMessage ? window.pageData.nextTagMessage : 'BikeTag @ new Mystery Location'
		window.pageData.nextTagTitle = window.pageData.nextTagTitle ? window.pageData.nextTagTitle : 'Play a new BikeTag at a new Mystery Location to begin round'
		window.pageData.locationMessage = window.pageData.locationMessage ? window.pageData.locationMessage : 'Describe where the Mystery Location was found'
		window.pageData.locationPlaceholder = window.pageData.locationPlaceholder ? window.pageData.locationPlaceholder : 'e.g. Cathedral Park, NE 42nd and Shaver, etc.'
		window.pageData.hintMessage = window.pageData.hintMessage ? window.pageData.hintMessage : 'Provide a hint for the new Mystery Location'
		window.pageData.hintPlaceholder = window.pageData.hintPlaceholder ? window.pageData.hintPlaceholder : 'e.g. puns, riddles, rhymes, nearby landmarks, where historical events occurred'
		window.pageData.nameTitle = window.pageData.nameTitle ? window.pageData.nameTitle : 'What do you go by?'
		window.pageData.nameMessage = window.pageData.nameMessage ? window.pageData.nameMessage : 'Provide a Name, UserName, Alias'
		window.pageData.namePlaceholder = window.pageData.namePlaceholder ? window.pageData.namePlaceholder : 'e.g. Your Reddit (u/) or Instagram handle (@), nickname, team name, real name'
		window.pageData.playButtonText = window.pageData.playButtonText ? window.pageData.playButtonText : 'Play BikeTag!'

		var newBikeTagMessage = window.pageData.newBikeTagMessage
		var proofTagMessage = window.pageData.proofTagMessage
		var proofTagTitle = window.pageData.proofTagTitle
		var nextTagMessage = window.pageData.nextTagMessage
		var nextTagTitle = window.pageData.nextTagTitle
		var locationMessage = window.pageData.locationMessage
		var locationPlaceholder = window.pageData.locationPlaceholder
		var hintMessage = window.pageData.hintMessage
		var hintPlaceholder = window.pageData.hintPlaceholder
		var nameTitle = window.pageData.nameTitle
		var nameMessage = window.pageData.nameMessage
		var namePlaceholder = window.pageData.namePlaceholder
		var playButtonText = window.pageData.playButtonText

		// var uploadBox = `<div class="upload-box">
		// 	<i class="fa fa-icon fa-bicycle"></i>
		// 	<i class="fa fa-icon fa-image"></i>
		// 	<span></span>
		// </div>`

		var uploadBox = `<div class="upload-box" data-message="(MESSAGE)">
			<img src="../../../assets/img//blank-tag.png"></img>
			<span>(MESSAGE)</span>
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

		heading.className = "field half"
		first.className = "field half first"
		second.className = "field half first"
		third.className = "field half"
		fourth.className = "field half"
		jameson.className = "field"
		submit.className = "actions"

		heading.innerHTML = `<h1>${newBikeTagMessage}</h1>`

		first.innerHTML = `<h3>${proofTagTitle}</h3>
		<label for="currentTag"></label>
		<input type="file" name="currentTag" class="hidden" required />
		${uploadBox.replace(/MESSAGE/g, proofTagMessage)}
		${proofPreview}`

		second.innerHTML = `<label for="location">${locationMessage}</label>
		<input type="text" name="location" placeholder="${locationPlaceholder}" />`

		third.innerHTML = `<h3>${nextTagTitle}</h3>
		<label for="nextTag"></label>
		<input type="file" name="nextTag" class="hidden" required />
		${uploadBox.replace(/MESSAGE/g, nextTagMessage)}
		${nextPreview}`

		fourth.innerHTML = `<label for="hint">${hintMessage}</label>
		<input type="text" name="hint" placeholder="${hintPlaceholder}" />`

		jameson.innerHTML = `<h3>${nameTitle}</h3><label for="name">${nameMessage}</label>
		<input type="text" name="name" placeholder="${namePlaceholder}" />`

		submit.innerHTML = `<li><button id="submit">${playButtonText}</button></li>`

		heading.id = "heading"
		first.id = "previousTag"
		second.id = "location"
		third.id = "nextTag"
		fourth.id = "hint"
		jameson.id = "name"
		submit.id = "submit"

		form.appendChild(heading)
		form.appendChild(hr1)
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
			SecureToken: "cb941e93-d300-4314-97d4-bf01dedf7b4a",
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
		theButton.innerHTML = `Please wait while your images are uploaded <i class="fa fa-spinner fa-spin" style="font-style:24px;"></i>`

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
			var tagContainer = document.createElement('div')
			tagContainer.className = "m-imgur-post"
			var tagTemplate = this.biketagImageTemplate(tag, heading || "Tag", true)
			tagContainer.innerHTML = tagTemplate
			tagContainer.querySelector('a').addEventListener('click', function (e) {
				var isArchive = document.body.classList.contains('archive')
				var content = '<img src="' + this.getAttribute('href') + '"></img>'

				if (isArchive) {
					content = `${tagTemplate}`
				}

				e.preventDefault()
				e.stopPropagation()

				if (window.uglipop && isArchive) {
					window.uglipop({
						source: 'html',
						class: 'm-imgur-post s--popup',
						content,
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

	biketagImageTemplate(image, title, loadImage = false) {
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
		return `<a href="${image.link}" target="_blank">
					<span>${tagNumber}</span>
					<span>${tagCredit}</span>
					<img ${!!loadImage ? `src="${thumbnail}"` : ''} data-src="${thumbnail}">
					<h2 class="description">${title}</h2>
				</a>`
	}

	getCurrentTagInformation() {
		var tagInformation = {
			currentTagNumber: 0,
			hasTag: false,
			currentTag: null,
			hint: null,
			credit: null,
		}

		if (imgur.imgurAlbumPictures.length) {
			tagInformation.currentTag = imgur.imgurAlbumPictures[0]

			if (tagInformation.currentTag) {
				var tagHintSplit = tagInformation.currentTag.description.split('(')
				var tagHint = tagHintSplit.length > 1 ? tagHintSplit[1].split(')')[0] : null
				var tagCreditSplit = tagInformation.currentTag.description.split('by')
				var tagCredit = tagCreditSplit[tagCreditSplit.length - 1]
				var tagNumberSplit = tagInformation.currentTag.description.split(' ')
				var tagNumberString = tagNumberSplit.length ? tagNumberSplit[0].substr(1) : -1

				tagInformation.hasTag = true
				tagInformation.currentTagNumber = Number(tagNumberString)
				tagInformation.credit = tagCredit
				tagInformation.hint = tagHint
			}
		}

		tagInformation.nextTagNumber = tagInformation.currentTagNumber + 1

		return tagInformation
	}

	showImageThumbnail(event) {
		var target = event.target
		var file = target.files[0]
		var fileReader = new FileReader()
		var uploadContainer = target.parentElement.querySelector('.upload-box')
		var previewContainer = target.parentElement.querySelector('.m-imgur-post')

		var changeToThumbnailImage = function (src, revoke = false) {
			var img = previewContainer.querySelector('img')
			var uploadFilenameSpan = uploadContainer.querySelector('span')

			previewContainer.classList.remove('hidden')
			uploadContainer.classList.add('s--uploaded')
			uploadContainer.classList.add('hidden')

			uploadFilenameSpan.innerText = file.name
			img.src = src

			if (revoke) {
				URL.revokeObjectURL(url)
			}
		}
		var changeBackToUploader = function () {
			previewContainer.classList.add('hidden')
			uploadContainer.classList.remove('hidden')
			uploadContainer.classList.remove('hidden')
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

	setLatestTagInformation() {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.setLatestTagInformation.bind(this))
		}

		if (!this.latestTagInformationHasBeenSet) {
			this.latestTagInformationHasBeenSet = true
		} else {
			return
		}

		console.log('loading lazy load images')
		window.lazyLoadInstance = new LazyLoad()

		var images = imgur.imgurAlbumPictures
		if (!!images && images.length) {
			var lastImage = images[0]
			this.renderBikeTag(lastImage, "Current mystery location to find", `#${this.formID} #heading`)

			// Set the form with the tag information
			var currentTagInfo = this.getCurrentTagInformation()
			$('#biketagUploadForm h1').html($('#biketagUploadForm h1').text() + ' ' + poundSymbol + currentTagInfo.currentTagNumber + '?')
			$('#previousTag h3').html($('#previousTag h3').text() + ' ' + poundSymbol + currentTagInfo.currentTagNumber)
			$('#nextTag h3').html($('#nextTag h3').text() + ' ' + poundSymbol + currentTagInfo.nextTagNumber)
			$('#tagNumber').html(poundSymbol + currentTagInfo.nextTagNumber)
			$('#proofNumber').html(poundSymbol + currentTagInfo.currentTagNumber)
			if (!!currentTagInfo.hint && currentTagInfo.hint.length) {
				$('#hintText').text(currentTagInfo.hint)
				$('#userLeftHintMessage').text('provided the following hint:')
			} else {
				$('#hintText').text(`"${currentTagInfo.hint}"`)
				$('#userLeftHintMessage').text('did not leave a hint :(')
			}
			if (!!currentTagInfo.credit && currentTagInfo.credit.length) {
				$('#userCredit').text(currentTagInfo.credit)
			} else {
				$('#userCredit').text('user did not provide a name')
			}
		}
	}

	showLatestTagImages(count = -1) {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.showLatestTagImages.bind(this))
		}

		this.setLatestTagInformation()
		var countParam = this.getUrlParam('count')
		count = count == -1 ? false : (Number.isInteger(count) ? count : (countParam === 'all' ? countParam : Number(countParam)))

		if (count) {
			this.showArchiveTags(count)
		} else {
			document.body.classList.remove('archive')
			$('#header .content .inner').empty()

			var images = imgur.imgurAlbumPictures;
			var lastImage = images[0]
			this.renderBikeTag(lastImage, "Current mystery location to find")
		}
	}

	showArchiveTags(count) {
		if (!imgur.imgurAlbumPictures) {
			return imgur.getImgurAlbumPictures(null, this.showArchiveTags.bind(this))
		}
		document.body.classList.add('archive')
		$('#header .content .inner').empty()

		var images = imgur.imgurAlbumPictures;
		count = Number.isInteger(count) ? count : this.getUrlParam('count')
		count = Number.isInteger(count) ? count : !count || (count.toUpperCase() === "ALL") ? images.length : Number(count)

		for (var i = 1;
			(i <= (count * 2)) && (i < images.length); ++i) {
			var image = images[i]
			this.renderBikeTag(image, image.description)
		}
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

		// COVID-19 Banner
		this.createNotification(`BikeTag asks you to play responsibly on <a target="_blank" href="https://www.pedalpalooza.org/post/scavenger-hunt-june-21st-2020">Pedalpalooza Scavenger Hunt Day</a> by wearing masks and staying two bikes apart.`, "bg-orange", 5000)

		var form = document.querySelector(this.targetSelector)
		form.addEventListener('submit', function (e) {
			e.preventDefault()
			self.onUploadFormSubmit(e.currentTarget).bind(self)
		})

		var headerLogo = document.querySelector('#header > .logo')
		headerLogo.addEventListener('click', function () {
			self.showLatestTagImages()
		})

		var tagItButton = document.getElementById('tagItButton')
		tagItButton.addEventListener('click', function(){
			self.showLatestTagImages()
		})

		form.querySelectorAll('input[type="file"]').forEach(function (fileInput) {
			fileInput.addEventListener('change', self.showImageThumbnail.bind(self))
		})

		var uploadBoxes = form.querySelectorAll('.upload-box')
		uploadBoxes.forEach(function (uploadBox) {
			uploadBox.addEventListener('click', function (event) {
				var parentElement = event.target.parentElement.parentElement
				var uploadFileInput = parentElement.querySelector('input[type="file"]')
				uploadFileInput.click()
			})
		})

		var archiveButtonEl = document.getElementById('archiveButton')
		archiveButtonEl.addEventListener('click', function(event) {
			self.showArchiveTags(10)
		})

		var inputChangedEvent = 'keyup'

		var locationInput = form.querySelector('input[name="location"]')
		locationInput.addEventListener(inputChangedEvent, function (event) {
			var target = event.target
			var text = target.value
			var preview = form.querySelector('#proofPreview')

			preview.innerText = text
		})

		var hintInput = form.querySelector('input[name="hint"]')
		hintInput.addEventListener(inputChangedEvent, function (event) {
			var target = event.target
			var text = target.value
			var preview = form.querySelector('#hintPreview')

			preview.innerText = text
		})

		var nameInput = form.querySelector('input[name="name"]')
		nameInput.addEventListener(inputChangedEvent, function (event) {
			var target = event.target
			var text = target.value
			var previews = form.querySelectorAll('#namePreview')

			previews.forEach(function (preview) {
				preview.innerText = text
			})
		})

		var deleteImageButtons = form.querySelectorAll('.m-imgur-post .close')
		deleteImageButtons.forEach(function (button) {
			button.addEventListener('click', function (event) {
				var previewContainer = event.target.parentElement
				var uploadContainer = previewContainer.parentElement.querySelector('.upload-box')
				var uploadSpanEl = uploadContainer.querySelector('span')

				$(uploadContainer).parent().find('input[type="file"]').val('')

				uploadSpanEl.innerText = uploadContainer.dataset.message
				uploadContainer.classList.remove('s--uploaded')
				uploadContainer.classList.remove('hidden')
				previewContainer.classList.add('hidden')
			})
		})
	}
}

window.biketag = new BikeTag()
window.biketag.BikeTag = BikeTag
