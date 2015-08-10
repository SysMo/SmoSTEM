module.exports = function(grunt) {

// Project configuration.
grunt.initConfig({
	pkg : grunt.file.readJSON('package.json'),
	uglify : {
		options : {
			banner : '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		},
		build : {
			src : '../static/js/<%= pkg.name %>.js',
			dest : '../static/js/<%= pkg.name %>.min.js'
		}
	},	
	concat : {
		options : {
			// define a string to put between each file in the
			// concatenated output
			separator : ';'
		},
		distSrc : {
			// the files to concatenate
			src : '<%= pkg.srcFiles %>',
			// the location of the resulting JS file
			dest : '../static/js/<%= pkg.name %>.js'
		},
//		distLib : {
//			// the files to concatenate
//			src : '<%= pkg.libFiles %>',
//			// the location of the resulting JS file
//			dest : '../static/js/<%= pkg.name %>ExtLibs.js'
//		}
	},
	jshint : {
		files : '<%= pkg.srcFiles %>',
		options : {
			// options here to override JSHint defaults
			globals : {
				jQuery : true,
				console : true,
				document : true
			}
		}
	},
	watch : {
		files : [ '<%= pkg.srcFiles %>' ],
		tasks : [ 'default' ]
	}
});

grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-watch');

grunt.registerTask('merge', ['concat:distSrc']); //, 'concat:distLib']);
grunt.registerTask('default', [ 'jshint', 'concat', 'uglify' ]);
};