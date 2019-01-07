var Sail = function()
{
    var self = {};

    function extend(cons, def)
	{
		for(k in def)
		{
			cons.prototype[k] = def[k];
		}
	}

	var Class = function(defination)
	{
        if (!defination)
        {
            definition = {};
        }

		let initialize = function(){}
       
		if(defination.construct)
		{
			if(typeof defination.construct === 'function')
			{
				initialize = defination.construct;
                delete defination.construct;
			}
			else
			{
				console.log("Contructor should be a function");
			}
        }
        else if(defination.extends)
        {
            initialize = defination.extends;
        }
        
        if(defination.extends)
        {
            initialize.prototype = defination.extends.prototype;
            delete defination.extends;
        }

		extend(initialize, defination);

		return initialize;
    }
    self.Class = Class;

    // Vector
    var Vector = new Class(
    {
        construct : function(x, y)
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

    // Input Layer
    var input = {
        isPressed : {},
        keyUp : function(key)
        {
            this.isPressed[key] = false;
        },
        keyDown : function(key)
        {
            this.isPressed[key] = true;
        },
        detect: function()
        {
            document.addEventListener("keyup", function(e)
            {
                input.keyUp(e.keyCode);
            });
    
            document.addEventListener("keydown", function(e)
            {
                input.keyDown(e.keyCode);
            });
        }
    }

    self.Input = {
        A : 65,
        isDown : function(key)
        {
            return input.isPressed[key];
        }
    };

    // Asset loading
    var AssetManager = {
        assets : {},
        toLoad : {},
        load : function(callback)
        {
            this.toLoadLength = Object.keys(this.toLoad).length;
            this.completed = 0;
            this.callback = callback;
            for(name in this.toLoad)
            {   
                this.loadImage(name);
            }
        },
        loadImage : function(name)
        {
            var image = new Image();
            image.onload = function()
            {
                AssetManager.completed ++;
                AssetManager.assets[name] = image;
                delete AssetManager.toLoad[name];

                if(AssetManager.completed >= AssetManager.toLoadLength)
                {
                    AssetManager.callback();
                }
            }
            image.src = this.toLoad[name];
        }
    }   

    self.load = function(name, src)
    {
        AssetManager.toLoad[name] = src;
    }

    // Game object
    var Sprite = new Class(
    {
        construct : function(x, y, w, h, src)
        {
            this.position = new Vector(x, y);
            this.scale = new Vector(w, h);
            this.src = src;
        },
        render : function()
        {
            GameManager.context.drawImage(this.src,
                this.position.x, this.position.y,
                this.scale.x, this.scale.y);
        }
    });

    // Scene system
    self.Scene = new Class(
    {
        construct : function()
        {
            this.gameObjects = [];
        },
        preload : function()
        {},
        start : function()
        {},
        update : function()
        {},
        render : function()
        {
            for(i in this.gameObjects)
            {
                this.gameObjects[i].render();
            }
        },
        addSprite : function(x, y, w, h, src)
        {
            var image = AssetManager.assets[src];
            if(image)
            {
                var sprite = new Sprite(x, y, w, h, image);
                this.gameObjects.push(sprite);
                return sprite;
            }
            else
            {
                throw new Error("Unable to load asset - " + src);
            }
        },
    });

    var GameManager = {
        canvas : null,
        context : null,
        scenes : {}
    }

    self.create = function(config)
    {
        if(config.canvas)
		{
			GameManager.canvas = config.canvas;			
			GameManager.context = canvas.getContext("2d");
            let width, height = 0;
			if(config.width && config.height)
			{
				width = config.width;
			    height = config.height;
			}
			else
			{
				width = 500;
				height = 500;
			}

			GameManager.canvas.width = width;
			GameManager.canvas.height = height;
            
            if(config.scenes)
            {
                GameManager.scenes = config.scenes;
            }
            else
            {
                throw new Error("No scenes found in the config", config);
            }

			delete config;
		}
		else
		{
			throw new Error("No canvas found the config", config);
		}
    }

    self.start = function(sceneName)
    {
        var scene = GameManager.scenes[sceneName]
        if(!scene)
        {
            throw new Error(scene + " scene does not exists")
        }

        scene.preload();
        // TODO - load assets.

        AssetManager.load(function()
        {
            input.detect();
            scene.start();
            gameLoop(scene);
        });
    } 
    
    function gameLoop(scene)
    {
        requestAnimationFrame(function()
        {
            // Clear screen
            GameManager.context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update scene
            scene.update();
            scene.render();
            
            gameLoop(scene);
        });
    }

    return self;
}


