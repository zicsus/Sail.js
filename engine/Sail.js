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
        
        if(defination.extends)
        {
            initialize.prototype = defination.extends.prototype;
            delete defination.extends;
        }

		extend(initialize, defination);

		return initialize;
    }

    self.Class = Class;

    // Scene system
    self.Scene = new Class(
    {
        construct : function()
        {
            this.gameObjects = {};
        },
        preload : function()
        {},
        start : function()
        {},
        update : function()
        {},
        keyPress: function(key)
        {},
        keyDown : function(key)
        {},
        keyUp : function(key)
        {},
        add : function(name, object)
        {
            this.gameObjects[name] = object;
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

        scene.start();

        keyboardInput(scene);
        gameLoop(scene);
    } 
    
    function keyboardInput(scene)
    {
        document.addEventListener("keyup", function(e)
        {
            scene.keyUp(e.keyCode);
        });

        document.addEventListener("keydown", function(e)
        {
            scene.keyDown(e.keyCode);
        });

        document.addEventListener("keypress", function(e)
        {
            scene.keyPress(e.keyCode);
        })
    }

    function gameLoop(scene)
    {
        requestAnimationFrame(function()
        {
            scene.update();
            //gameLoop(scene);
        });
    }

    return self;
}


