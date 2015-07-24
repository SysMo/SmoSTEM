Stem.service('ClipboardService',
	function(ngToast, StemUtil, $timeout) {
		this.buffer = [];
		this.copy = function(obj) {
			copyOfObj = angular.copy(obj);
			copyOfObj.id = StemUtil.guid();
			this.buffer.push({type: obj.type, content: copyOfObj});
			$timeout(function() {
				ngToast.success({
			        content:'Copy',
			        dismissOnTimeout: true,
			        timeout: 1500
			     });  
		    });
		}
		this.paste = function() {
			var pasteContent = [];
			for (var i=0, l=this.buffer.length; i<l; i++) {
				pasteContent.push(this.buffer[i].content);
			}
			this.buffer = [];
			ngToast.success({
		        content:'Paste',
		        dismissOnTimeout: true,
		        timeout: 1500
		     });  
			return pasteContent;
		}
	}
);