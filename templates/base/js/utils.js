/// TODO: turn this pattern into a frontend package using {{ "utils" | javascript_package }}
/// TODO: accompanying the above: {{ "biketag" | javascript_package: "window.imgur.init()" }}
((isSet) => {
	if(isSet) return

	class Utils {
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
	
		formatUserName(userName) {
			if (userName.startsWith("U/")) {
				return "u/" + userName.substr(2)
			} else {
				return userName
			}
		}
	}

	window.utils = new Utils()
})(window.utils)
