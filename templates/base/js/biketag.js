class BikeTag {
	constructor() {
		// Auto-Pickup?
		this.target = null
		this.targetSelector = 'form #submit'
		this.formID = "biketagUploadForm"
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

	onUploadFormSubmit(formEl) {
		var theButton = formEl.querySelector('ul')
		theButton.innerHTML = `Please wait while your images are uploaded <i class="fa fa-spinner fa-spin" style="24px"></i>`

		try {
			var form = $(`#${this.formID}`)
			var fileInputs = form.find('input[type="file"]')
			var files = []
			var user = ''
			var proofLocation = ''

			// get the latest tag number
			var currentTagInfo = imgur.getCurrentTagInformation()
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

					biketag.adminEmailAddresses.forEach(function (emailAddress) {
						const subject = "New Bike Tag Post (#" + currentTagInfo.nextTagNumber + ")"
						const body = "Hello BikeTag Admin, A new post has been created!\r\nTo post this tag to Reddit manually, go to " + window.location.host + "/get/reddit to get the reddit post template.\r\n\r\nYou are getting this email because you are listed as an admin on the site (" + window.location.host + "). Reply to this email to request to be removed from this admin list."
						emailPromises.push(this.sendNotificationEmail(emailAddress, subject, body))
					}.bind(this))

					Promise.all(emailPromises).then(function () {
						window.location.href = window.location.pathname + '?uploadSuccess=true'
					})

				}.bind(this))
			}.bind(this))
		} catch(e) {
			console.error(e)
			formEl.innerHTML = `<h3>Error</h3><p>Your tag could not be posted. :(</p><p>If this issue persists, please reach out to <a href="hello@biketag.org">hello@biketag.org</a> for help.</p>`
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
			self.onUploadFormSubmit(e.currentTarget)
		})

	}
}

window.BikeTag = new BikeTag()
window.BikeTag.BikeTag = BikeTag
