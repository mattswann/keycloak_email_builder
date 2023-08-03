const fs = require("fs-extra");
const glob = require("glob");
const chokidar = require("chokidar");

const twig = require("twig");
const html_from_mjml = require("mjml");


twig.cache(false);


function throttle(func, limit) {
	let last_run = 0;
	let throttle_timeout;
	
	return function() {
		const func_context = this;
		const func_arguments = arguments;
		
		if(Date.now() >= last_run + limit) func.apply(func_context, func_arguments);
		
		else {
			clearTimeout(throttle_timeout);
			
			throttle_timeout = setTimeout(function() {
				func.apply(func_context, func_arguments);
				last_run = Date.now();
			}, (last_run + limit - Date.now()));
		}
	};
}



function render_templates() {
	console.log("[templates] Starting");
	
	const file_list = glob.sync("source/templates/*.twig");
	
	for(const file_name of file_list) {
		twig.renderFile(file_name, {}, function(err, mjml) {
			if(err) return console.error(err);
		
			var output = html_from_mjml(mjml, { keepComments: false, minify: false });
			if(output.errors.length) return console.error(mjmlOutput.errors);
			
			var new_name = file_name.replace("source/templates/", "build/").replace(".twig", ".html");
			
			fs.outputFileSync(new_name, output.html);
		});
	};
	
	console.log("[templates] Finished\n");
}

function rebuild_assets() {
	console.log("[assets] Starting");
	
	fs.removeSync("build");
	fs.ensureDirSync("build");
	fs.ensureDirSync("build/assets");
	fs.copySync("source/assets", "build/assets");
	
	console.log("[assets] Finished\n");
}

rebuild_assets();
render_templates();

if(process.argv.length > 2 && process.argv[2] == "watch") {
	chokidar.watch("source/templates/**/*").on("change", throttle(render_templates, 10000));
	
	// chokidar.watch("source/assets/**/*").on("change", rebuild_assets);
}
