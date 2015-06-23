Stem.factory('stemTable', function() {
	var stemTable = {};
	stemTable.Table = function(idSelector, columns, value) {
		this.idSelector = idSelector;
		this.tableNode = $(idSelector)[0];
		this.columns = columns;
		this.data = value;
		this.renderTable();
		
	}
	stemTable.Table.prototype.renderTable = function() {
		this.tableNode.innerHTML = "";
		var table = this;
		columns = angular.copy(this.columns);
		columns.unshift({name: '#'});
		var node = document.createElement("TR");
		var row = this.tableNode.appendChild(node);
		for (var j=0; j<columns.length; j++) {
			node = document.createElement("TD");
			var cell = row.appendChild(node);
			cell.innerHTML = columns[j].name;
			cell.addEventListener("click", function() {
				//console.log(table.columns[Array.prototype.indexOf.call(this.parentNode.childNodes, this) - 1]);
			});
		}
		for (var i=0; i<this.data.length; i++) {
			node = document.createElement("TR");
		    row = this.tableNode.appendChild(node);
		    node = document.createElement("TD");
		    node.innerHTML = i;
		    row.appendChild(node);
		    for (j=0; j<this.columns.length; j++) {
		    	node = document.createElement("TD");
		        cell = row.appendChild(node);
		        cell.innerHTML = "<input data-row='" + i + "' data-col='" + j + "'/>";
		        cell.childNodes[0].value 
		        	= this.columns[j].format ? numeral(this.data[i][j]).format(this.columns[j].format) : numeral(this.data[i][j]).value();
		        cell.addEventListener('contextmenu', function(ev) {
		            ev.preventDefault();
		            $.contextMenu({
		    			selector: 'body',
		    			reposition: false,
		    			events: {  
		    				hide: function() {
		    					$.contextMenu('destroy');
		    				}
		    			},
		                callback: $.proxy(function(key, options) {
		                	switch(key){
		    					case "addRowBefore":
		    						this.addRow(parseInt(ev.target.dataset.row));
		    						break;
		    					case "addRowAfter":
		    						this.addRow(parseInt(ev.target.dataset.row), 'after');
		    						break;
		    					case "delRow":
		    						this.delRow(parseInt(ev.target.dataset.row));
		    						break;
		    					case "addColumnBefore":
		    						var promptVal = prompt("Please enter column name", "");
		    						if (promptVal != null) {
		    							this.addColumn(parseInt(ev.target.dataset.col), promptVal);
		    						}
		    						break;
		    					case "addColumnAfter":
		    						var promptVal = prompt("Please enter column name", "");
		    						if (promptVal != null) {
		    							this.addColumn(parseInt(ev.target.dataset.col), promptVal, 'after');
		    						}
		    						break;
		    					case "delColumn":
		    						this.delColumn(parseInt(ev.target.dataset.col));
		    						break;
		    					case "renameColumn":
		    						promptVal = prompt("Please enter new column name", "");
		    						if (promptVal != null) {
		    							this.renameColumn(parseInt(ev.target.dataset.col), promptVal);
		    						}
		    						break;
		    					case "resize":
		    						promptVal = prompt("Please enter number of rows", "");
		    						if (promptVal != null) {
		    							this.resize(parseInt(promptVal));
		    						}
		    						break;
		    					case "setColFormat":
		    						promptVal = prompt("Please enter the format for this column", "");
		    						if (promptVal != null) {
		    							this.setColFormat(parseInt(ev.target.dataset.col), promptVal);
		    						}
		    						break;
		    					default:
		    						break;
		                	}
		                }, table),
		                items: 
		                {
		                    "addRowBefore":    {name: "Add row before", icon: "edit"},
		                    "addRowAfter":    {name: "Add row after", icon: "edit"},
		                    "delRow":    {name: "Delete row", icon: "edit"},
		                    "addColumnBefore":    {name: "Add column before", icon: "edit"},
		                    "addColumnAfter":    {name: "Add column after", icon: "edit"},
		                    "delColumn": {name: "Delete column", icon: "edit"},
		                    "resize": {name: "Resize", icon: "edit"},
		                    "renameColumn": {name: "Rename column", icon: "edit"},
		                    "setColFormat": {name: "Column format", icon: "edit"},
		                    
		                }
		            });
		            return false;
		        }, false);
		    }
		}
		
		this.INPUTS=[].slice.call($(this.idSelector + " input"));
		this.INPUTS.forEach(function(elm) {
		    elm.onblur = function(e) {
		    	table.data[elm.dataset.row][elm.dataset.col] = 
		    		//isNaN(parseFloat(elm.value)) ? elm.value : parseFloat(elm.value);
		    		numeral().unformat(elm.value);
		        //table.updateView();
		    	elm.value = table.columns[elm.dataset.col].format ? numeral(table.data[elm.dataset.row][elm.dataset.col]).format(table.columns[elm.dataset.col].format) : numeral(table.data[elm.dataset.row][elm.dataset.col]).value();
		    };
		});
	};
	
	stemTable.Table.prototype.updateView = function() {
		var table = this;
		this.INPUTS.forEach(function(elm) { 
			//elm.value = table.data[elm.dataset.row][elm.dataset.col];
			elm.value = table.columns[elm.dataset.col].format ? numeral(table.data[elm.dataset.row][elm.dataset.col]).format(table.columns[elm.dataset.col].format) : numeral(table.data[elm.dataset.row][elm.dataset.col]).value();
	    });
		
	};
	
	stemTable.Table.prototype.addRow = function(index, where) {
		if (where == 'after') {
			index = index + 1;
		}
		var newRow = [];
		for (var i=0; i<this.columns.length; i++) {
			newRow.push(0);
		}
		this.data.splice(index, 0, newRow);
		this.renderTable();
		this.updateView();
	};
	stemTable.Table.prototype.delRow = function(index) {
		this.data.splice(index, 1);
		this.renderTable();
		this.updateView();
	};
	stemTable.Table.prototype.resize = function(numRows) {
		if (numRows <= this.data.length) {
			this.data.splice(numRows, this.data.length - numRows);
		} else {
			var dataLength = this.data.length;
			var newRow = [];
			for (var i=0; i<this.columns.length; i++) {
				newRow.push(0);
			}
			for (var i=0; i<numRows - dataLength; i++) {
				this.data.push(angular.copy(newRow));
			}
		}
		this.renderTable();
		this.updateView();
	};
	stemTable.Table.prototype.addColumn = function(index, name, where) {
		if (where == 'after') {
			index = index + 1;
		}
		this.columns.splice(index, 0, {name: name});
		for (var i=0; i<this.data.length; i++) {
			this.data[i].splice(index, 0, 0);
		}
		this.renderTable();
		this.updateView();
	};
	stemTable.Table.prototype.delColumn = function(index) {
		this.columns.splice(index, 1);
		for (var i=0; i<this.data.length; i++) {
			this.data[i].splice(index, 1);
		}
		this.renderTable();
		this.updateView();
	};
	stemTable.Table.prototype.renameColumn = function(index, name) {
		this.columns[index].name = name;
		this.tableNode.childNodes[0].childNodes[index + 1].innerHTML = name;
	};
	stemTable.Table.prototype.setColFormat = function(index, format) {
		this.columns[index].format = format;
		this.renderTable();
		this.updateView();
	};
	return stemTable;
});