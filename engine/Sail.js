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
    var AssetType = {
        IMG : 0,
        TILE : 1
    }

    var TileMap = new Class(
    {   
        construct : function(name, image, width, height)
        {
            this.name = name;
            this.image = image;
            this.cellWidth = width;
            this.cellHeight = height; 
            this.rows = this.image.width / this.cellWidth;
            this.cols = this.image.height / this.cellHeight;
            this.tiles = {};
        },
        getTile : function(cellNo)
        {
            var x = (cellNo % this.cols) * this.cellWidth;
            var y = (cellNo % this.rows) * this.cellHeight;
            return {
                x:x, y:y, image: this.image
            };
        }
    });

    var Asset = new Class(
    {
        construct : function(name, type) 
        {
            this.name = name;
            this.type = type;
            this.path = "";
        },
        setSrc :  function(src, x, y, width, height)
        {
            if(this.type == AssetType.IMG)
            {
                this.src = src;
            }
            else if(this.type == AsssetType.TILE)
            {
                this.src = {src : src, x : x, y : y, width:width, height:height};
            }
        }
    });

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
                let asset = new Asset(name, AssetType.IMG);
                asset.src = image;
                AssetManager.assets[name] = image;
                delete AssetManager.toLoad[name];

                if(AssetManager.completed >= AssetManager.toLoadLength)
                {
                    AssetManager.callback();
                }
            }
            image.src = this.toLoad[name];
        },
        loadFromTilemap : function(name, src)
        {

        }
    }   

    self.loadImage = function(name, src)
    {
        let asset = new Asset(name, AssetType.IMG);
        asset.path = src;
        AssetManager.toLoad[name] = asset;
    }

    self.loadFromTileMap = function(name, src, x, y, width, height)
    {
        let asset = new Asset(name, AssetType.TILE);
        asset.path = src;

    }

    // Animations


    // Game object
    var Sprite = new Class(
    {
        construct : function(x, y, w, h, asset)
        {
            this.position = new Vector(x, y);
            this.scale = new Vector(w, h);
            this.asset = asset;
        },
        smoothing : true,
        render : function()
        {
            GameManager.context.imageSmoothingEnabled = tihs.smoothing;
            if(this.asset.type == AssetType.IMG)
            {
                GameManager.context.drawImage(this.asset.getSrc,
                    this.position.x, this.position.y,
                    this.scale.x, this.scale.y);
            }
            else if(this.asset.type == AssetType.TILE)
            {
                GameManager.context.drawImage(this.asset.getSrc.src, 
                    this.asset.getSrc.x, this.asset.getSrc.y,
                    this.asset.getSrc.width, this.asset.getSrc.height,
                    this.position.x, this.position.y,
                    this.scale.x, this.scale.y);
            }
            else
            {
                throw new Error("Unable to determine assset type");
            }
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
        createAnim : function(src)
        {

        }
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


