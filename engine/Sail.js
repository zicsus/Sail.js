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
    self.Vector = Vector;

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
        TILEMAP: 1,
        TILE : 2
    }

    var Tile = new Class(
    {
        construct : function(parent, cellNo, start, end)
        {
            this.parent = parent;
            this.cellNo = cellNo;
            this.start = start;
            this.end = end;
        }
    });

    var TileMap = new Class(
    {   
        construct : function(name, image, cellWidth, cellHeight)
        {
            this.name = name;
            this.image = image;
            this.cellWidth = cellWidth;
            this.cellHeight = cellHeight; 
            this.rows = Math.floor(this.image.width / this.cellWidth);
            this.cols = Math.floor(this.image.height / this.cellHeight);
            this.tiles = [];
            this.tileNames = {};

            this.createTiles();
        },
        createTiles : function()
        {
            var cells = this.rows * this.cols;
            for(let i = 0; i < cells; i++)
            {
                let start = new Vector( ((i % this.cols) * this.cellWidth), 
                    ((Math.floor(i / this.rows)) * this.cellHeight) );
                let end = new Vector(start.x + this.cellWidth, start.y + this.cellHeight);
                
                let tile = new Tile(this, i, start, end);
            
                this.tiles[i] = tile;
            }
        },
        getTile : function(cellNo)
        {   
            return this.tiles[cellNo];
        }
    });

    var Asset = new Class(
    {
        construct : function(name, type, src) 
        {
            this.name = name;
            this.type = type;
            this.src = src;
        }
    });

    var Raw = new Class(
    {
        construct : function(name, type, src)
        {
            this.type = type;
            this.src = src; 
            this.name = name;
        }
    });

    var AssetManager = {
        assets : {},
        toLoad : [],
        load : function(callback)
        {
            this.toLoadLength = Object.keys(this.toLoad).length;
            this.completed = 0;
            this.callback = callback;
            
            this.recurse(0);
        },
        loadImage : function(index)
        {
            let raw = this.toLoad[index];
            var image = new Image();
            image.onload = function()
            {
                AssetManager.completed ++;
                let asset = new Asset(raw.name, AssetType.IMG, image);
                AssetManager.assets[raw.name] = asset;
                delete AssetManager.toLoad[index];

                AssetManager.recurse(index + 1);
            }
            image.src = raw.src;
        },
        loadTileMap : function(index)
        {
            let raw = this.toLoad[index];
            var image = new Image();
            image.onload = function()
            {
                AssetManager.completed ++;

                let tileMap = new TileMap(raw.name, image, raw.cellWidth, raw.cellHeight);
                let asset = new Asset(raw.name, AssetType.TILEMAP, tileMap);
                AssetManager.assets[raw.name] = asset;

                delete AssetManager.toLoad[index];

                AssetManager.recurse(index+1);
            }
            image.src = raw.src;
        },  
        loadFromTileMap : function(index)
        {
            let raw = this.toLoad[index];
            let tileMap = this.assets[raw.src];
            if(tileMap)
            {
                if(tileMap.type == AssetType.TILEMAP)
                {
                    AssetManager.completed ++;
                    let tile = tileMap.src.tiles[raw.cellNo];
                    tileMap.src.tileNames[name] = raw.cellNo;

                    let asset = new Asset(raw.name, AssetType.TILE, tile);

                    AssetManager.assets[raw.name] = asset;
                    delete this.toLoad[index];

                    AssetManager.recurse(index + 1);
                }
                else
                    throw new Error("Asset is not a tilemap");
            }
            else
                throw new Error("TileMap not found");
        },
        recurse(index)
        {
            if(AssetManager.completed >= AssetManager.toLoadLength)
            {
                AssetManager.callback();
                return;
            }

            switch(this.toLoad[index].type)
            {
                case AssetType.IMG:
                    this.loadImage(index);
                    break;
                case AssetType.TILEMAP:
                    this.loadTileMap(index);
                    break;
                case AssetType.TILE:
                    this.loadFromTileMap(index);
                    break;
                default:
                    throw new Error("Asset type not supported");
            }
        }
    }   

    self.loadImage = function(name, src)
    {
        let raw = new Raw(name, AssetType.IMG, src);
        AssetManager.toLoad.push(raw);
    }

    self.loadTileMap = function(name, src, cellWidth, cellHeight)
    {
        let raw = new Raw(name, AssetType.TILEMAP, src);
        raw.cellWidth = cellWidth;
        raw.cellHeight = cellHeight;
        AssetManager.toLoad.push(raw);
    }

    self.loadFromTileMap = function(name, src, cellNo)
    {
        let raw = new Raw(name, AssetType.TILE, src);
        raw.cellNo = cellNo;
        AssetManager.toLoad.push(raw);
    }

    // Animations
    var Animation = new Class(
    {
        construct : function(name, tileMap, range, time)
        {
            this.name = name;
            this.tileMap = tileMap;
            this.range = range;
            this.time = time;
            this.create();
        },
        create : function()
        {
            this.tiles = [];

            let max =  Math.max(this.range.x, this.range.y);
            if(this.tileMap.tiles.length > max)
            {
                if(this.range.x == max)
                {
                    for(var i = max; i >= this.range.y; i--)
                        this.tiles.push(this.tileMap.tiles[i]);
                }
                else
                {
                    for(var i = this.range.x; i <= max; i++)
                        this.tiles.push(this.tileMap.tiles[i]);
                }
            }
            else
            {
                throw new Error("Animation out of range");
            }
        }
    });

    function startAnimation(parent)
    {   
        let index = 0;
        let reverse = false;
        
        wait();

        function animate()
        {
            if(reverse)
            {
                index--;
                console.log(index);
                parent.asset = new Asset(parent.anim.name, AssetType.TILE, parent.anim.tiles[index]);
            }
            else
            {
                console.log(index);
                parent.asset = new Asset(parent.anim.name, AssetType.TILE, parent.anim.tiles[index]);
                if(index == parent.anim.tiles.length - 1)
                    reverse = true;
                else
                    index++;
            }

            wait();
        }

        function wait()
        {
            if(reverse && index == 0)
            {
                parent.isAnimating = false;
                return;
            }

            setTimeout(function()
            {
                console.log("yahh");
                animate();
            }, parent.anim.time);
        }
    }

    // Game object
    var Sprite = new Class(
    {
        construct : function(x, y, w, h, asset, parent)
        {
            this.parent = parent;
            this.position = new Vector(x, y);
            this.scale = new Vector(w, h);
            this.asset = asset;
            this.isAnimating = false;
        },
        smoothing : true,
        render : function()
        {
            GameManager.context.imageSmoothingEnabled = this.smoothing;
            if(this.asset.type == AssetType.IMG)
            {
                GameManager.context.drawImage(this.asset.src,
                    this.position.x, this.position.y,
                    this.scale.x, this.scale.y);
            }
            else if(this.asset.type == AssetType.TILE)
            {
                GameManager.context.drawImage(this.asset.src.parent.image, 
                    this.asset.src.start.x, this.asset.src.start.y,
                    this.asset.src.parent.cellWidth, this.asset.src.parent.cellHeight,
                    this.position.x, this.position.y,
                    this.scale.x, this.scale.y);
            }
            else
            {
                throw new Error("Unable to determine assset type");
            }
        },
        animate : function(animation)
        {
            if(this.isAnimating)
            {
                return
            }

            this.isAnimating = true;
            this.anim = this.parent.anims[animation];
            
            if(this.anim)
            {
                startAnimation(this)
            } 
            else
            {
                throw new Error("Animation not found - ", animation);
            }
        },
        changeTile : function()
        {
            this.asset = 
            
            this.index++;
            if(this.index > this.anim.tiles.length - 1)
            {
                return
            }  

            this.wait();
        },
        wait : function()
        {
            
            setTimeout(this.changeTile, this.anim.time);
        }
    });

    

    // Scene system
    self.Scene = new Class(
    {
        construct : function()
        {
            this.gameObjects = [];
            this.anims = {};
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
            var asset = AssetManager.assets[src];
            if(asset)
            {
                var sprite = new Sprite(x, y, w, h, asset, this);
                this.gameObjects.push(sprite);
                return sprite;
            }
            else
            {
                throw new Error("Unable to load asset - " + src);
            }
        },
        createAnim : function(name, tileMap, range, time)
        {
            var asset = AssetManager.assets[tileMap];
            if(tileMap)
            {
                let anim = new Animation(name, asset.src, range, time);
                this.anims[name] = anim;
            }
            else
            {
                throw new Error("Unable to find tile map - ", tileMap);
            }
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


