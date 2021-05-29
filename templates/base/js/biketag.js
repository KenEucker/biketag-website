var poundSymbol = '<div class="normal-text">#</div>'

class BikeTag {
    constructor() {
        // Auto-Pickup?
        this.target = null
        this.targetSelector = 'form #submit'
        this.formID = 'biketagUploadForm'
        this.albumHash =
            window.pageData && window.pageData.imgur ? window.pageData.imgur.albumHash : null
    }

    closeNotification() {
        var notification = document.getElementById('notification')
        if (notification) {
            $(notification).fadeOut()
            // notification.style.display = 'none'
        }
    }

    createNotification(message, color, expire = 3000) {
        var wrapper = document.getElementById('wrapper')
        var notification = document.createElement('div')
        notification.id = 'notification'
        notification.className = color
        notification.innerHTML = `${message} <a class="close">close</a>`
        wrapper.prepend(notification)

        var close = document.querySelector('#notification .close')
        close.addEventListener('click', this.closeNotification)

        window.setTimeout(this.closeNotification, expire)
    }

    getUrlParam(param) {
        var searchParams = new URLSearchParams(window.location.search)

        if (!param) {
            return searchParams
        } else {
            return searchParams.get(param)
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

        if (!target) return

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

        window.pageData = !!window.pageData ? window.pageData : { page: {} }
        var pageData = Object.assign(
            {
                newBikeTagMessage: 'Did you find the Mystery Location played in round',
                proofTagMessage: 'BikeTag @ matching Mystery Location',
                proofTagTitle: 'Play a BikeTag that matches the Biketag in round',
                currentTagMessage: 'BikeTag @ new Mystery Location',
                currentTagTitle: 'Play a new BikeTag at a new Mystery Location to begin round',
                locationMessage: 'Describe where the Mystery Location was found',
                locationPlaceholder: 'e.g. Cathedral Park, NE 42nd and Shaver, etc.',
                hintMessage: 'Provide a hint for the new Mystery Location',
                hintPlaceholder:
                    'e.g. puns, riddles, rhymes, nearby landmarks, where historical events occurred',
                nameTitle: 'What do you go by?',
                nameMessage: 'Provide a Name, Username, Alias',
                namePlaceholder:
                    'e.g. Your Reddit (u/) or Instagram handle (@), nickname, team name, real name',
                playButtonText: 'Play BikeTag!',
            },
            window.pageData.page,
        )
        window.pageData.page = pageData

        var newBikeTagMessage = pageData.newBikeTagMessage
        var proofTagMessage = pageData.proofTagMessage
        var proofTagTitle = pageData.proofTagTitle
        var currentTagMessage = pageData.currentTagMessage
        var currentTagTitle = pageData.currentTagTitle
        var locationMessage = pageData.locationMessage
        var locationPlaceholder = pageData.locationPlaceholder
        var hintMessage = pageData.hintMessage
        var hintPlaceholder = pageData.hintPlaceholder
        var nameTitle = pageData.nameTitle
        var nameMessage = pageData.nameMessage
        var namePlaceholder = pageData.namePlaceholder
        var playButtonText = pageData.playButtonText

        // var uploadBox = `<div class="upload-box">
        // 	<i class="fa fa-icon fa-bicycle"></i>
        // 	<i class="fa fa-icon fa-image"></i>
        // 	<span></span>
        // </div>`

        var uploadBox = `<div class="upload-box" data-message="(MESSAGE)">
			<img src="../../../public/img/blank-tag.png"></img>
			<span>(MESSAGE)</span>
		</div>`

        var proofPreview = `<div class="m-imgur-post hidden">
			<span class="close"></span>
			<img src="../../../public/img/none.png">
			<h2 class="description"><span class="s--proofNumber"></span> found at (<span id="proofPreview"></span>) by <span id="namePreview"></span></h2>
		</div>`

        var nextPreview = `<div class="m-imgur-post hidden">
			<span class="close"></span>
			<img src="../../../public/img/none.png">
			<h2 class="description"><span class="s--tagNumber"></span> tag (<span id="hintPreview"></span>) by <span id="namePreview"></span></h2>
		</div>`

        heading.className = 'field half'
        first.className = 'field half first'
        second.className = 'field half first'
        third.className = 'field half'
        fourth.className = 'field half'
        jameson.className = 'field'
        submit.className = 'actions'

        heading.innerHTML = `<h1>${newBikeTagMessage}</h1>`

        first.innerHTML = `<h3>${proofTagTitle}</h3>
		<label for="currentTag"></label>
		<input type="file" name="currentTag" class="hidden" required />
		${uploadBox.replace(/MESSAGE/g, proofTagMessage)}
		${proofPreview}`

        second.innerHTML = `<label for="location">${locationMessage}</label>
		<input type="text" name="location" id="location" placeholder="${locationPlaceholder}" required />`

        third.innerHTML = `<h3>${currentTagTitle}</h3>
		<label for="currentTag"></label>
		<input type="file" name="currentTag" class="hidden" required />
		${uploadBox.replace(/MESSAGE/g, currentTagMessage)}
		${nextPreview}`

        fourth.innerHTML = `<label for="hint">${hintMessage}</label>
		<input type="text" name="hint" id="hint" placeholder="${hintPlaceholder}" />`

        jameson.innerHTML = `<h3>${nameTitle}</h3><label for="name">${nameMessage}</label>
		<input type="text" name="name" id="name" placeholder="${namePlaceholder}" required />`

        submit.innerHTML = `<li><button id="submit">${playButtonText}</button></li>`

        heading.id = 'heading'
        first.id = 'proofTag'
        second.id = 'location'
        third.id = 'currentTag'
        fourth.id = 'hint'
        jameson.id = 'name'

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

    sendNotificationEmail(tagnumber = 'current') {
        return fetch('/api/post/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tagnumber,
            }),
        })
            .then(function (res) {
                return res.json()
            })
            .catch(function (error) {
                console.error('Post Email Error:', error)
            })
            .then((message) => console.log(message))
    }

    formatUsername(username) {
        if (username.startsWith('U/')) {
            return 'u/' + username.substr(2)
        } else {
            return username
        }
    }

    onUploadFormSubmit(formEl) {
        const theButton = formEl.querySelector('ul')
        const prevHTML = theButton.innerHTML
        theButton.innerHTML = `Please wait while your images are uploaded <i class="fa fa-spinner fa-spin" style="font-style:24px;"></i>`

        try {
            const form = $(`#${this.formID}`)
            const fileInputs = form.find('input[type="file"]')
            const files = []
            window.pageData = !!window.pageData ? window.pageData : {}

            // get the current tag number
            const currentTagInfo = this.getCurrentTagInformation()
            const user = this.formatUsername(form.find('input[name="name"]').val())
            const proofLocation = form.find('input[name="location"]').val()
            const hint = form.find('input[name="hint"]').val()

            for (let i = 0; i < fileInputs.length; ++i) {
                const $files = fileInputs[i].files

                if ($files.length) {
                    // Reject big files
                    if ($files[0].size > $(this).data('max-size') * 1024) {
                        window.alert('Please select a smaller file')
                        theButton.innerHTML = prevHTML
                        return
                    }

                    if (!$files[0].type.startsWith('image/')) {
                        window.alert('Please only select image files')
                        theButton.innerHTML = prevHTML
                        return
                    }

                    files.push($files[0])
                } else {
                    window.alert('I need both files!')
                    theButton.innerHTML = prevHTML
                    return
                }
            }

            if (files[0].name === files[1].name && files[0].size === files[1].size) {
                window.alert(
                    'The 2 pictures look identical. Please select 2 different pictures for the tag and the proof.',
                )
                theButton.innerHTML = prevHTML
                return
            }

            const locationString =
                proofLocation && proofLocation.length ? ' found at ( ' + proofLocation + ' )' : ''
            const hintString = hint && hint.length ? ' (hint:  ' + hint + ' )' : ''
            const image1Description =
                '#' + currentTagInfo.currentTagNumber + ' proof' + locationString + ' by ' + user
            const image2Description =
                '#' + currentTagInfo.mysteryTagNumber + ' tag' + hintString + ' by ' + user

			const image1 = files[0]
			const image2 = files[1]
			let image1UploadedAttempt = null
			let image1UploadedSuccess = false
			let image2UploadedAttempt = null
			let image2UploadedSuccess = false

			const checkBothImagesUploaded = (preText = '') => {
				if (image1UploadedSuccess && image2UploadedSuccess) {
					console.log(`${preText} - success!`)

					/// TODO: Send message to the server that a new tag has been queued
					this.sendNotificationEmail(currentTagInfo.mysteryTagNumber).then(function () {
						window.location.href =
							`${window.location.pathname}?uploadSuccess=true&flushcache=true&message=${preText}`
					})
				} else if (!image1UploadedAttempt || !image2UploadedAttempt) {
					console.log(`${preText} - both images have not completed uploading`)
				} else {
					console.log(`${preText} - image upload failed.`)
					window.location.href =
							`${window.location.pathname}?uploadError=true&message=${preText}`
				}
			}

			setTimeout(() => {
				image1UploadedAttempt = false
				imgur.uploadImageToImgur(image1, image1Description, (response) => {
					image1UploadedAttempt = true
					if (response.error) {
						console.log({ image1UploadError: response.error })
	
						checkBothImagesUploaded(`Image 1 upload failed. ${response.error}`)
					} else {
						image1UploadedSuccess = true
						
						checkBothImagesUploaded()
					}
				})
			}, 3)

			setTimeout(() => {
				image2UploadedAttempt = false
				imgur.uploadImageToImgur(image2, image2Description, (response) => {
					image2UploadedAttempt = true
					if (response.error) {
						console.log({ image1UploadError: response.error })
	
						checkBothImagesUploaded(`Image 2 upload failed. ${response.error}`)
					} else {
						image2UploadedSuccess = true
						
						checkBothImagesUploaded()
					}
				})
			}, 3000)
        } catch (e) {
            console.error(e)
            formEl.innerHTML = `<h3>Error</h3><p>Your tag could not be posted. :(</p><p>If this issue persists, please reach out to <a href="hello@biketag.org">hello@biketag.org</a> for help.</p>`
        }
    }

    getTagNumberIndex(tagNumber) {
        var images = imgur.imgurAlbumPictures
        var tagNumberIndex = images.length + 1 - (tagNumber - (tagNumber % 2) + 1) * 2

        var verifyTagNumber = function (index) {
            return index > -1
                ? images[index].description.indexOf('#' + tagNumber + ' tag') != -1
                : -1
        }
        if (verifyTagNumber(tagNumberIndex)) {
            return tagNumberIndex
        } else if (tagNumberIndex < images.length + 1 && verifyTagNumber(tagNumberIndex + 1)) {
            return tagNumberIndex + 1
        } else if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
            return tagNumberIndex - 1
        }

        for (var i = 0; i < images.length; ++i) {
            if (verifyTagNumber(i)) {
                tagNumberIndex = i
            }
        }

        return tagNumberIndex
    }

    getProofTagNumberIndex(tagNumber) {
        var images = imgur.imgurAlbumPictures
        var tagNumberIndex = images.length + 1 - (tagNumber - (tagNumber % 2) + 1) * 2

        var verifyProofTagNumber = function (index) {
            return images[index].description.indexOf('#' + tagNumber + ' proof') != -1
        }
        if (verifyProofTagNumber(tagNumberIndex)) {
            return tagNumberIndex
        } else if (tagNumberIndex + 1 < images.length && verifyProofTagNumber(tagNumberIndex + 1)) {
            return tagNumberIndex + 1
        } else if (tagNumberIndex > 0 && verifyProofTagNumber(tagNumberIndex - 1)) {
            return tagNumberIndex - 1
        }

        for (var i = 0; i < images.length; ++i) {
            console.log(`looking for ${tagNumber} with ${i}`)
            if (verifyProofTagNumber(i)) {
                tagNumberIndex = i
            }
        }

        return tagNumberIndex
    }

    renderBikeTag(tag, heading, targetSelector, eraseContent = false, className = '') {
        var targetContainer =
            typeof targetSelector !== 'object'
                ? document.querySelector(targetSelector || '.content .inner')
                : targetSelector

        if (targetContainer) {
            if (eraseContent) {
                targetContainer.innerHTML = ''
            }
            var tagContainer = document.createElement('div')
            tagContainer.className = `m-imgur-post fadeIn ${className}`
            var tagTemplate = this.biketagImageTemplate(tag, heading || 'Tag')
            tagContainer.innerHTML = tagTemplate

            tagContainer.querySelector('a').addEventListener('click', function (e) {
                var isArchive = document.body.classList.contains('archive')
                var isSingle = document.body.classList.contains('single')
                /// TODO: progressively load this image
                var content =
                    '<img src="' + this.getAttribute('href').replace('l.', '.') + '"></img>'

                if (isArchive || isSingle) {
                    content = `${tagTemplate}`
                }

                e.preventDefault()
                e.stopPropagation()

                // if (isArchive || popDialogue || isSingle) {
                // window.uglipop({
                // 	source: 'html',
                // 	class: 'm-imgur-post s--popup fadeInSlow',
                // 	content,
                // });
                // }
            })

            if (targetContainer.appendChild) targetContainer.appendChild(tagContainer)
            else if (targetContainer.append) targetContainer.append(tagContainer)
        }

        return targetContainer
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

	getBikeTagDiscussionLinkFromImage(image) {
		var tagTitle = image.title || ''
		var tagDiscussionLinkIndex = tagTitle.indexOf('{')
		var tagDiscussionLink
		if (tagDiscussionLinkIndex !== -1) {
			var tagDisscussionSplit = tagTitle ? tagTitle.split('{') : []
			var tagDiscussionLinkLength = tagDisscussionSplit[1].indexOf('}')
			tagDiscussionLink = tagDisscussionSplit[1].substr(0, tagDiscussionLinkLength).trim()
		}
		
		return tagDiscussionLink
	}

    biketagImageTemplate(image, title, loadImage = false) {
        var imageLinkStringSplit = image.link.split('.')
        var imageLinkStringEnd = '.' + imageLinkStringSplit[imageLinkStringSplit.length - 1]
        var thumbnail = image.link.replace(imageLinkStringEnd, 'l' + imageLinkStringEnd)
        var tagNumber = '0',
            tagCredit = "your'e it",
            imageToLoad = image.link

        if (image.gifv) {
            thumbnail = image.link
            imageToLoad = image.gifv
        }

        if (image.description) {
            var split = image.description.split(' ')
            tagNumber = split[0].replace('#', poundSymbol)

            var splitFor = image.description.split('for')
            var splitBy = image.description.split('by')
            tagCredit =
                splitBy.length > 1 ? splitBy[splitBy.length - 1] : splitFor[splitFor.length - 1]
        }

        // console.log('setting image link', image.link, image);
        return `<a href="${image.link}" target="_blank">
					<div>
						<span>${tagNumber}</span>
						<span>${tagCredit}</span>
						<img alt="${image.description}" class="lazy" src="${thumbnail}" data-src="${imageToLoad}">
					</div>
					<h2 class="description">${title}</h2>
				</a>`
    }

    getCurrentTagInformation() {
        if (!!this.currentTagInfo) {
            return this.currentTagInfo
        }

        var tagInformation = {
            currentTagNumber: 0,
            hasTag: false,
            currentTag: null,
            hint: null,
            credit: null,
        }

        if (imgur.imgurAlbumPictures.length) {
            tagInformation.currentTag = !!imgur.imgurAlbumPictures[0].description
                ? imgur.imgurAlbumPictures[0]
                : imgur.imgurAlbumPictures.length > 1
                ? imgur.imgurAlbumPictures[1]
                : 0
        } else if (window.currentBikeTag) {
            tagInformation.currentTag = window.currentBikeTag.image
        }

        if (tagInformation.currentTag) {
            var tagHintSplit = tagInformation.currentTag.description
                ? tagInformation.currentTag.description.split('(')
                : []
            var tagHint = tagHintSplit.length > 1 ? tagHintSplit[1].split(')')[0] : ''
            var tagCreditSplit = tagInformation.currentTag.description
                ? tagInformation.currentTag.description.split('by')
                : []
            var tagCredit = tagCreditSplit.length ? tagCreditSplit[tagCreditSplit.length - 1] : ''
            var tagNumberSplit = tagInformation.currentTag.description
                ? tagInformation.currentTag.description.split(' ')
                : []
            var tagNumberString = tagNumberSplit.length ? tagNumberSplit[0].substr(1) : 0


            // var tagTitle = tagInformation.currentTag.title || ''
            // var tagDiscussionLinkIndex = tagTitle.indexOf('{')
            var tagDiscussionLink = this.getBikeTagDiscussionLinkFromImage(tagInformation.currentTag)
            // if (tagDiscussionLinkIndex !== -1) {
                // var tagDisscussionSplit = tagTitle ? tagTitle.split('{') : []
                // var tagDiscussionLinkLength = tagDisscussionSplit[1].indexOf('}')
                // tagDiscussionLink = tagDisscussionSplit[1].substr(0, tagDiscussionLinkLength).trim()
            // }

            tagInformation.hasTag = true
            tagInformation.currentTagNumber = Number(tagNumberString)
            tagInformation.credit = tagCredit
            tagInformation.hint = tagHint
            tagInformation.discussionLink = tagDiscussionLink
        }

        tagInformation.mysteryTagNumber = tagInformation.currentTagNumber + 1

        this.currentTagInfo = tagInformation

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
                    type: file.type,
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

    setCurrentTagInformation(cb) {
        if (!imgur.imgurAlbumPictures) {
            return imgur.getImgurAlbumPictures(
                this.albumHash,
                !!cb ? cb : this.setCurrentTagInformation.bind(this),
            )
        }

        if (!this.currentTagInformationHasBeenSet) {
            this.currentTagInformationHasBeenSet = true
        } else {
            return this.getCurrentTagInformation()
        }

        var images = imgur.imgurAlbumPictures
        if (!!images && images.length) {
            var currentTagInfo = this.getCurrentTagInformation()

            if (!currentTagInfo.currentTag) {
                return currentTagInfo
            }

            this.renderBikeTag(
                currentTagInfo.currentTag,
                'Current mystery location to find',
                `#${this.formID} #heading`,
                true,
            )
            console.log('updating lazy load after setting current tag information')
            window.lazyLoadInstance.update()

            // Set the form with the tag information
            $(`#${this.form} h1`).html(
                $(`#${this.form} h1`).text() +
                    ' ' +
                    poundSymbol +
                    currentTagInfo.currentTagNumber +
                    '?',
            )
            $('#proofTag h3').html(
                $('#proofTag h3').text() + ' ' + poundSymbol + currentTagInfo.currentTagNumber,
            )
            $('#currentTag h3').html(
                $('#currentTag h3').text() + ' ' + poundSymbol + currentTagInfo.mysteryTagNumber,
            )
            $('.s--tagNumber').html(poundSymbol + currentTagInfo.mysteryTagNumber)
            $('.s--proofNumber').html(poundSymbol + currentTagInfo.currentTagNumber)

            if (!!currentTagInfo.hint && currentTagInfo.hint.length) {
                $('#hintText').text(currentTagInfo.hint)
                // $('#userLeftHintMessage').text('provided the following hint:')
            } else if (!!currentTagInfo.credit && currentTagInfo.credit.length) {
                $('#userCredit').text(currentTagInfo.credit)
                $('#userLeftHintMessage').text('did not leave a hint :(')
            } else {
                $('#userLeftHintMessage').text('no hint or player information provided')
            }

            if (currentTagInfo.discussionLink && currentTagInfo.discussionLink.length) {
                $('.discussion a').attr('href', currentTagInfo.discussionLink)
                $('.discussion').addClass('live')
            }
        }

        return currentTagInfo
    }

    showCurrentBikeTag(count = -1) {
        if (!imgur.imgurAlbumPictures) {
            this.tempCount = count
            return imgur.getImgurAlbumPictures(this.albumHash, this.showCurrentBikeTag.bind(this))
        }

        var currentTagInfo = this.setCurrentTagInformation()
        var countParam = this.getUrlParam('count')
        count = !!this.tempCount ? this.tempCount : count
        count =
            count == -1
                ? false
                : Number.isInteger(count)
                ? count
                : countParam === 'all'
                ? countParam
                : Number(countParam)
        this.tempCount = null

        if (count) {
            this.showArchiveTags(count)
        } else {
            // const containerSelector = '#header .content .inner.single'
            this.activateInnerContainer('single')

            // if (currentTagInfo.currentTag) {
            // 	this.renderBikeTag(currentTagInfo.currentTag, "Current mystery location to find", containerSelector)
            // } else {
            // 	this.showNewGameImage()
            // }
        }
    }

    activateInnerContainer(to, emptyContainer = false, remove = ['archive', 'single']) {
        if (emptyContainer) innerContainerElement.empty()

        const containerSelector = '#header .content'
        const innerContainerSelector = '.inner'
        const containerElement = $(containerSelector)
        const activeContainerElement = containerElement.find(`${innerContainerSelector}.active`)

        if (remove && remove.length) {
            remove.forEach((removeClass) => {
                document.body.classList.remove(removeClass)
                // activeContainerElement.removeClass(removeClass)
            })
        }
        activeContainerElement.fadeOut()
        document.body.classList.add(to)

        const innerContainerElement = containerElement.find(`${innerContainerSelector}.${to}`)
        innerContainerElement.addClass('active')
        innerContainerElement.fadeIn()

        return innerContainerElement
    }

    showNewGameImage() {
        this.renderBikeTag(this.config.newGameImage, 'New BikeTag game coming soon!', true)
    }

    showArchiveTags(count, emptyContainer = false) {
        if (!imgur.imgurAlbumPictures) {
            return imgur.getImgurAlbumPictures(this.albumHash, this.showArchiveTags.bind(this))
        }

        const innerContainerElement = this.activateInnerContainer('archive', emptyContainer)

        if (this.archiveLoaded) {
            $('#header .content .inner.single').show()
            return
        }

        var images = imgur.imgurAlbumPictures
        count = Number.isInteger(count) ? count : this.getUrlParam('count')
        const countWasSet = !!count
        const countWasAll = countWasSet && count == 'all'
        count = Number.isInteger(count)
            ? count
            : typeof count === 'string' && count.toUpperCase() === 'ALL'
            ? images.length
            : 10

        const atEnd = (i) => i <= count * 2 && i < images.length
        const columnClass = `col-md-6`

        for (var i = 1; atEnd(i); ++i) {
            var image1 = images[i],
                image2
            image2 = atEnd(i + 1) ? images[++i] : null
            let row = document.createElement('div')
            row.className = 'row'

            row = this.renderBikeTag(image1, image1.description, row, false, columnClass)

            if (image2) {
                row = this.renderBikeTag(image2, image2.description, row, false, columnClass)
            }

            innerContainerElement.append(row)
        }

        const archiveUrlPath = `/archive${
            countWasSet ? `?count=${countWasAll ? 'all' : count}` : ''
        }`
        window.history.pushState({}, archiveUrlPath, archiveUrlPath)
        this.archiveLoaded = true
        console.log('updating lazy load after creating archive images')
        window.lazyLoadInstance.update()
    }

    showBikeTagNumber(tagNumber, emptyContainer = false) {
        if (!imgur.imgurAlbumPictures) {
            return imgur.getImgurAlbumPictures(this.albumHash, this.showBikeTagNumber.bind(this))
        }

        document.body.classList.add('single')
        tagNumber = Number.isInteger(tagNumber) ? tagNumber : this.getTagNumberFromURL()
        var images = imgur.imgurAlbumPictures
        var imageCount = Math.round(images.length / 2 + ((images.length - 1) % 2))

        const innerContainerElement = this.activateInnerContainer('post', emptyContainer)

        if (tagNumber && tagNumber < imageCount) {
            var theTag = images[this.getTagNumberIndex(tagNumber)]
            var proofTag = images[this.getProofTagNumberIndex(tagNumber)]

            if (proofTag) {
                this.renderBikeTag(proofTag, 'Found It Tag', innerContainerElement)
            }
            if (theTag) {
                this.renderBikeTag(theTag, 'Original Tag', innerContainerElement)
            }
            window.history.pushState({}, `/${tagNumber}`, `/${tagNumber}`)
        } else if (tagNumber == imageCount) {
            var newTag = images[this.getTagNumberIndex(tagNumber)]

            this.renderBikeTag(newTag, 'Current Tag')
            window.history.pushState({}, '/', '/')
        }
        console.log('updating lazy load after showing the biketag number', tagNumber)
        window.lazyLoadInstance.update()
    }

    addTagPostingEventListeners() {
        this.appendBiketagForm(this.target)

        var form = document.querySelector(this.targetSelector)

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault()
                this.onUploadFormSubmit(e.currentTarget)
            })

            var deleteImageButtons = form.querySelectorAll('.m-imgur-post .close')
            deleteImageButtons.forEach(function (button) {
                button.addEventListener('click', function (event) {
                    var previewContainer = event.target.parentElement
                    var uploadContainer = previewContainer.parentElement.querySelector(
                        '.upload-box',
                    )
                    var uploadSpanEl = uploadContainer.querySelector('span')

                    $(uploadContainer).find('input[type="file"]').val('')

                    uploadSpanEl.innerText = uploadContainer.dataset.message
                    uploadContainer.classList.remove('s--uploaded')
                    uploadContainer.classList.remove('hidden')
                    previewContainer.classList.add('hidden')
                })
            })

            form.querySelectorAll('input[type="file"]').forEach((fileInput) => {
                fileInput.addEventListener('change', this.showImageThumbnail)
            })

            var uploadBoxes = form.querySelectorAll('.upload-box')
            uploadBoxes.forEach(function (uploadBox) {
                uploadBox.addEventListener('click', function (event) {
                    var parentElement = event.target.parentElement.parentElement
                    var uploadFileInput = parentElement.querySelector('input[type="file"]')
                    uploadFileInput.click()
                })
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

            // var tagItButton = document.getElementById('tagItButton')
            // tagItButton.addEventListener('click', function(){
            // 	self.showCurrentBikeTag()
            // })
        }
    }

    init(targetSelector, readonly) {
        this.readonly = readonly
        this.targetSelector = targetSelector
        this.target = document.querySelector(this.targetSelector)
        var resend = this.getUrlParam('resendNotification') === 'true'

		if (resend) {
			this.sendNotificationEmail()
		}

        if (window.currentBikeTag) {
            console.log('page loaded with current biketag', window.currentBikeTag)

            this.renderBikeTag(
                window.currentBikeTag.image,
                'Current mystery location to find',
                '.content .inner',
                true,
            )
        }

        if (!this.readonly) {
            this.addTagPostingEventListeners()
        } else {
            this.target.innerHTML =
                "<h3>Region not supported</h3><p>Currently, this version of biketag is being managed elsewhere. If you need to create a biketag post that is not affiliated with any region, go to <a href='Http://post.biketag.org'>here to post a global tag</a>.</p>"
        }

        // COVID-19 Banner
        // this.createNotification(`BikeTag asks you to play responsibly on <a target="_blank" href="https://www.pedalpalooza.org/post/scavenger-hunt-june-21st-2020">Pedalpalooza Scavenger Hunt Day</a> by wearing masks and staying two bikes apart.`, "bg-orange", 5000)

        var headerLogo = document.querySelector('#header .header--logo')
        if (headerLogo) {
            headerLogo.addEventListener('click', () => {
                window.history.pushState({}, '/', '/')
                this.showCurrentBikeTag()
            })
        }

        var archiveButtonEl = document.getElementById('archiveButton')
        if (archiveButtonEl) {
            archiveButtonEl.addEventListener('click', () => {
                if (document.body.classList.contains('archive')) {
                    this.showCurrentBikeTag()
                } else {
                    this.showArchiveTags(10)
                }
            })
        }

        var tagItButton = document.getElementById('tagItButton')
        if (tagItButton) {
            tagItButton.addEventListener('click', () => {
                this.showCurrentBikeTag()
            })
        }

        setTimeout(() => {
            imgur.getImgurAlbumPictures(this.albumHash)
        }, 20000)
    }
}

window.biketag = new BikeTag()
window.biketag.BikeTag = BikeTag
