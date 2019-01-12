var Sail = function()
{
	var self = {};

	function extent(cons, def)
	{
		for(k in def)
		{
			cons.prototype[k] = def[k];
		}
	}

	let Class = function(defination)
	{
		let constructor = function(){}

		if(defination.constructor != undefined)
		{
			if(typeof defination.constructor === 'function')
			{
				constructor = defination.constructor;
				delete defination.constructor;
			}
			else
			{
				console.log("Contructor should be a function");
			}
		}

		constructor.prototype.constructor = constructor;
		extent(constructor, defination);

		return constructor;
	}

	let Vector2 = new Class(
	{
		constructor : function Vector2d(x, y)
		{
			this.x = x;
			this.y = y;
		},
		equals : function(vec)
		{
			return ((this.x == vec.x) && (this.y == vec.y));
		},
		add : function(vec)
		{
			this.x += vec.x;
			this.y += vec.y;
			return this
		},
		subtract : function(vec)
		{
			this.x -= vec.x;
			this.y -= vec.y;
			return this;
		},
		multiply : function(vec)
		{
			this.x *= vec.x;
			this.y *= vec.y;
			return this;
		},
		scale : function(value)
		{
			this.x *= value;
			this.y *= value;
			return this;
		},
		distance : function(vec)
		{
			let dx = this.x - vec.x;
			let dy = this.y - vec.y;
			return Math.sqrt(dx * dx + dy * dy);
		},
		length : function()
		{
			return Math.sqrt(this.x * this.x + this.y * this.y);
		},
		normalize : function()
		{
			let length = this.length();
			this.x /= length;
			this.y /= length;
			this.z /= length;
		}
	});

	var canvas;
	var context;

	self.create = function(config)
	{
		if(config.canvas)
		{
			canvas = config.canvas;			
			context = canvas.getContext("2d");

			if(config.width && config.height)
			{
				this.width = config.width;
				this.height = config.height;
			}
			else
			{
				this.width = 500;
				this.height = 500;
			}

			canvas.width = this.width;
			canvas.height = this.height;

			delete config;
		}
		else
		{
			throw new Error("No canvas found the config", config);
		}
	}

	// Gameobjects
	let Ball = new Class(
	{
		constructor : function(x, y, radius)
		{
			this.position = new Vector2(x, y);
			this.scale = new Vector2(width, 0);
		},
		render : function()
		{
			context.beginPath();
			context.arc(this.position.x, this.position.y, this.scale.x, 0, Math.PI * 2);
			context.fill();
			context.closePath();
		}
	});
	self.newBall = function(x, y, radius)
	{
		return new Ball(x, y, radius);
	}

	let Rect = new Class(
	{
		startValues : {},
		constructor: function(x, y, width, height)
		{
			this.position = new Vector2(x, y);
			this.scale = new Vector2(width, height);
			this.collider = new RectangleCollider(this);

			this.startValues.position = new Vector2(x, y);
			this.startValues.scale = new Vector2(width, height);
		}, 
		render : function()
		{	
			this.collider.render()
			context.beginPath();
			context.rect(this.position.x, this.position.y, this.scale.x, this.scale.y);
			context.fill();
			context.closePath();
		},
		reset : function()
		{
			this.position = this.startValues.position;
			this.scale = this.startValues.scale;
		}
	});
	self.newRect = function(x, y, w, h)
	{
		return new Rect(x, y, w, h);
	}

	// Collision detection

	function collisionDetection(gameObjects)
	{
		let length = gameObjects.length;
		for(var i = 0; i < length; i++)
		{
			for(var j = i + 1; j < length; j++)
			{
				var a = gameObjects[i];
				var b = gameObjects[j];
				if(isColliding(a.collider, b.collider))
				{
					console.log("collision");
				}
			}
		}
	}

	function isColliding(a, b)
	{
		if(a.type == "RECTCOLLIDER" && b.type == "RECTCOLLIDER")
		{
			if(a.parent.position.x < b.parent.position.x + b.parent.scale.x && 
				a.parent.position.x + a.parent.scale.x > b.parent.position.x &&
				a.parent.position.y < b.parent.position.y + b.parent.scale.y && 
				a.parent.position.y + a.parent.scale.y > b.parent.position.y)
			{
				return true;
			}

			return false;
		}
	}

	// Colliders
	var RectangleCollider = new Class({
		constructor : function(parent)
		{
			this.parent = parent;
			this.type = "RECTCOLLIDER";
		},
		render : function(x, y)
		{
			context.beginPath();
			context.rect(this.parent.position.x, this.parent.position.y,
						this.parent.scale.x, this.parent.scale.y);
			context.lineWidth = 1;
			context.strokeStyle = "green";
			context.stroke(); 
			context.closePath();
		}
	});



	// Manage scenes
	let Scene = new Class(
	{
		constructor : function()
		{
			this.gameObjects = [];
		},
		add : function(obj)
		{
			this.gameObjects.push(obj);
		},
		render : function()
		{
			for(var i in this.gameObjects)
			{
				this.gameObjects[i].render();
			}
			collisionDetection(this.gameObjects);
		},
		reset : function()
		{
			for(var i in this.gameObjects)
			{
				this.gameObjects[i].reset();
			}
		}
	});

	let SceneManager = {
		currentScene : 0,
		scenes : [],
		render : function()
		{
			this.scenes[this.currentScene].render();
		}
	}
	self.newScene = () =>
	{
		let scene = new Scene();
		return scene;
	}
	self.addScene = (scene) => 
	{
		SceneManager.scenes.push(scene);
	}
	self.changeScene = (index) => 
	{
		if(SceneManager.scenes.length > index && index >= 0)
		{
			SceneManager.currentScene = index;
			//SceneManager.scenes[index].reset();
		}
		else
		{
			throw new Error("Scene does not exists");
		}
	}
		
	// Game Loop
	let game;
	
	// Fps couter
	self.fps = 0;
	let startDate = new Date();
	let currentDate = new Date();
	let fpsCounter = 0;
	
	self.loop = function(g)
	{
		if(g != null)
		{
			game = g;
			delete g;
		}

		requestAnimationFrame(function()
		{
			// Count fps
			currentDate = new Date();
			var diff = (currentDate.getTime() - startDate.getTime()) / 1000;
			if(diff >= 1)
			{
				startDate = currentDate;
				self.fps = fpsCounter;
				fpsCounter = 0;
			}
			fpsCounter += 1;

			context.clearRect(0, 0, canvas.width, canvas.height);
			
			SceneManager.render();
			game();

			self.loop(null);
		});
	};

	return self;
}







