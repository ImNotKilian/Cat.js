var _cat = {
	elements: document.body.getElementsByTagName("*"),
	running: false,
	watchInstances: [],
	renderInstances: [],
	searchInstances: [],

	hide: function(element) {
		element.style.display = "none";
	},

	show: function(element) {
		element.style.display = "block";
	},

	value: function(selector) {
		return document.getElementById(selector).value;
	},

	inner: function(selector) {
		return document.getElementById(selector).innerHTML;
	},

	prepend: function(element, content) {
		element.innerHTML = content + element.innerHTML;
	},

	append: function(element, content) {
		element.innerHTML = element.innerHTML + content;
	},

	clean: function(element) {
		element.innerHTML = "";
	},

	search: function() {
		for (let elem of this.elements) {
			let searchInput = elem.getAttribute('render-search');
			if (searchInput != null) {
				this.searchInstances.push(setInterval(() => {
					let input = this.value(searchInput);

					if (input != null && input != "") {
						if (elem.innerHTML.includes(input))
							this.show(elem);
						else
							this.hide(elem);
					} else {
						this.show(elem);
					}

				}, 60));
			}
		}
	},

	iterator: function() {
		for (let elem of this.elements) {
			let iterateVariable = eval(elem.getAttribute('render-iterator'));
			
			if (iterateVariable != null) {
				let item = this.getPrefixed(elem.innerHTML, "ItemIterator");
				this.clean(elem);

				this.append(elem, this.setPrefixed(item, "ItemIterator"));

				for (let i = 0; i < iterateVariable.length; i++) { 
					this.append(elem, item.replace(/{i}/gi, i));
				}
			}
		}
	},

	jsoniterator: function() {
		for (let elem of this.elements) {
			let iterateUrl = elem.getAttribute('render-json');
			
			if (iterateUrl != null) {
				let item = this.getPrefixed(elem.innerHTML, "JsonIterator");
				this.clean(elem);

				this.append(elem, this.setPrefixed(item, "JsonIterator"));

				this.downloadJson("GET", iterateUrl, (json) => {
					for (let i = 0; i < json.length; i++) { 
						let newElement = this.parseHTML(item);
						let newChilds = newElement.getElementsByTagName("*");

						for (let j = 0; j < newChilds.length; j++) {
							if (newChilds[j].getAttribute('json-item') != null) {
								let value = eval("json[i]." + newChilds[j].getAttribute('json-item'))
								newChilds[j].innerHTML = value;
							}
						}

						this.append(elem, this.parseDocument(newElement));
					}
				});
			}
		}
	},

	listiterator: function() {
		for (let elem of this.elements) {
			let json = eval(elem.getAttribute('render-list'));
			
			if (json != null) {
				let item = this.getPrefixed(elem.innerHTML, "ListIterator");
				this.clean(elem);

				this.append(elem, this.setPrefixed(item, "ListIterator"));

				for (let i = 0; i < json.length; i++) { 
					let newElement = this.parseHTML(item);
					let newChilds = newElement.getElementsByTagName("*");

					for (let j = 0; j < newChilds.length; j++) {
						if (newChilds[j].getAttribute('json-item') != null) {
							let value = eval("json[i]." + newChilds[j].getAttribute('json-item'))
							newChilds[j].innerHTML = value;
						}
					}

					this.append(elem, this.parseDocument(newElement));
				}
			}
		}
	},

	parseHTML: function(str) {
		let parser = new DOMParser();
		return parser.parseFromString(str, 'text/html');
	},

	parseDocument: function(doc) {
		let serializer = new XMLSerializer();
		return serializer.serializeToString(doc);
	},

	downloadJson: function(method, url, callback) {
		let req = new XMLHttpRequest();

		req.onreadystatechange = function () {
			if (this.readyState == 4) {
				try {
					callback(JSON.parse(this.responseText));
				} catch (e) {
					console.error(e);
				}
			}
		}

		req.open(method, url);
		req.send();
	},

	setPrefixed: function (content, objectName) {
		const prefix = "<!--@Cat.js:" + objectName + " Object ";
		const suffix = " CAT-->";
		return prefix + content + suffix;
	},

	getPrefixed: function (content, objectName) {
		const prefix = "<!--@Cat.js:" + objectName + " Object ";
		let output = content.split(prefix)[1];


		
		if (output != null) return output.split(" CAT-->")[0];
		else return content;
	},

	watch: function() {
		for (let elem of this.elements) {
			let watch = elem.getAttribute('render-watch');
			if (watch != null) {
				this.watchInstances.push(setInterval(() => {
					try {
						if (watch.startsWith("#")) {
							let value;

							let reference = document.getElementById(watch.replace("#", ""));
							if (reference.value != null) value = reference.value;
							else value = reference.innerHTML;

							if (elem.innerHTML != value)
								elem.innerHTML = value;
						} else {
							elem.innerHTML = eval(watch);
						}
					} catch (e) {
						elem.innerHTML = e;
					}
				}, 60));
			}
		}
	},

	render: function() {
		for (let elem of this.elements) {
			this.renderInstances.push(setInterval(() => {
				let condition = elem.getAttribute('render-when');
				if (condition != null) {
					try {
						if (eval(condition) == true)
							this.show(elem);
						else
							this.hide(elem);
					} catch (e) {}
				}
			}, 60));
		}
	},

	variables: function() {
		for (let elem of this.elements) {
			const key = elem.getAttribute('render-var');
			if (key != null)
				try {
					elem.innerHTML = eval(key);
				} catch (e) {return elem.innerHTML = e}
		}
	},

	stop: function () {
		for (let i = 0; i < this.watchInstances.length; i++)
			clearInterval(this.watchInstances[i]);

		for (let i = 0; i < this.searchInstances.length; i++)
			clearInterval(this.searchInstances[i]);

		for (let i = 0; i < this.renderInstances.length; i++)
			clearInterval(this.renderInstances[i]);

		this.renderInstances = [];
		this.watchInstances = [];
		this.searchInstanece = [];

		this.running = false;
	},

	refresh: function() {
		this.iterator();
		this.variables();
	},

	init: function() {
		if (this.running)
			this.stop();

		this.running = true;
		this.search();
		this.iterator();
		this.variables();
		this.render();
		this.watch();
		this.jsoniterator();
		this.listiterator();
	}
}

_cat.init();