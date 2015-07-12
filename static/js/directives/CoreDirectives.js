Stem.directive('stemListItemActions', [function() {
	return {
		scope: {
			add: "&add",
			del: "&del",
			edit: "&edit",
			duplicate: "&duplicate",
			moveUp: "&moveUp",
			moveDown: "&moveDown",
		},
		templateUrl: "stem-list-item-actions",
		link: function(scope, element, attributes) {
			if (!("add" in attributes)) {
				scope.add = false;
			}
			if (!("del" in attributes)) {
				scope.del = false;
			}
			if (!("edit" in attributes)) {
				scope.edit = false;
			}
			if (!("duplicate" in attributes)) {
				scope.duplicate = false;
			}
			if (!("moveUp" in attributes)) {
				scope.moveUp = false;
			}
			if (!("moveDown" in attributes)) {
				scope.moveDown = false;
			}
		}
	}
}]);