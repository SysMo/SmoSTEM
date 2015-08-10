/*
 * Menu service used for managing  menus (mainMenu and rightMenu)
 */
Stem.service('MenuService', ['UserService', function(UserService) {
	// Define the menus object
	this.menus = {};

	// Validate menu existence
	this.validateMenuExistence = function(menuId) {
		if (menuId && menuId.length) {
			if (this.menus[menuId]) {
				return true;
			} else {
				throw new Error('Menu does not exists');
			}
		} else {
			throw new Error('MenuId was not provided');
		}

		return false;
	};

	// Get the menu object by menu id
	this.getMenu = function(menuId) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Return the menu object
		return this.menus[menuId];
	};

	// Add new menu object by menu id
	this.addMenu = function(menuId) {
		// Create the new menu
		this.menus[menuId] = {
			items: [],
		};

		// Return the menu object
		return this.menus[menuId];
	};

	// Remove existing menu object by menu id
	this.removeMenu = function(menuId) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Return the menu object
		delete this.menus[menuId];
	};
	
	// Add menu item object
	this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemGlyphicon, position) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Push new menu item
		this.menus[menuId].items.push({
			title: menuItemTitle,
			link: menuItemURL,
			menuItemType: menuItemType || 'item',
			menuItemClass: menuItemType,
			glyphicon: menuItemGlyphicon,
			position: position || 0,
			items: [],
		});

		// Return the menu object
		return this.menus[menuId];
	};

	// Add submenu item object
	this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemGlyphicon, position) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item
		for (var itemIndex in this.menus[menuId].items) {
			if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
				// Push new submenu item
				this.menus[menuId].items[itemIndex].items.push({
					title: menuItemTitle,
					link: menuItemURL,
					glyphicon: menuItemGlyphicon,
					position: position || 0,
				});
			}
		}

		// Return the menu object
		return this.menus[menuId];
	};

	// Remove existing menu object by menu id
	this.removeMenuItem = function(menuId, menuItemURL) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item to remove
		for (var itemIndex in this.menus[menuId].items) {
			if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
				this.menus[menuId].items.splice(itemIndex, 1);
			}
		}

		// Return the menu object
		return this.menus[menuId];
	};

	// Remove existing menu object by menu id
	this.removeSubMenuItem = function(menuId, submenuItemURL) {
		// Validate that the menu exists
		this.validateMenuExistence(menuId);

		// Search for menu item to remove
		for (var itemIndex in this.menus[menuId].items) {
			for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
				if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
					this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
				}
			}
		}

		// Return the menu object
		return this.menus[menuId];
	};
}]);